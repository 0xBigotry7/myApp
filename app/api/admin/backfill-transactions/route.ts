import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🔍 Checking for expenses without corresponding transactions...\n");

    // Get all expenses for this user
    const expenses = await prisma.expense.findMany({
      where: { userId: session.user.id },
      include: {
        user: true,
        trip: true,
      },
      orderBy: { date: "asc" },
    });

    console.log(`Found ${expenses.length} total expenses for user ${session.user.name}`);

    // Get all trip-related transactions for this user
    const tripTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        isTripRelated: true
      },
    });

    console.log(`Found ${tripTransactions.length} trip-related transactions`);

    // Create a map of existing transactions to avoid duplicates
    const transactionMap = new Map<string, boolean>();
    tripTransactions.forEach((txn) => {
      if (txn.tripId) {
        // Create a unique key based on trip, date, and amount
        const key = `${txn.tripId}-${new Date(txn.date).toISOString()}-${Math.abs(txn.amount)}`;
        transactionMap.set(key, true);
      }
    });

    let created = 0;
    let skipped = 0;

    for (const expense of expenses) {
      // Check if a transaction already exists for this expense
      const expenseKey = `${expense.tripId}-${new Date(expense.date).toISOString()}-${expense.amount}`;

      if (transactionMap.has(expenseKey)) {
        console.log(`⏭️  Skipping expense ${expense.id} - transaction already exists`);
        skipped++;
        continue;
      }

      // Get user's account or create one if it doesn't exist
      let account = await prisma.account.findFirst({
        where: { userId: session.user.id, isActive: true },
        orderBy: { createdAt: "asc" },
      });

      if (!account) {
        console.log(`⚠️  No account found - creating default account`);
        account = await prisma.account.create({
          data: {
            userId: session.user.id,
            name: "Main Account",
            type: "checking",
            balance: 0,
            currency: expense.currency || "USD",
            icon: "💳",
            color: "#3b82f6",
          },
        });
      }

      // Create the transaction
      console.log(`✅ Creating transaction for expense ${expense.id} (${expense.trip.name} - ${expense.category} - $${expense.amount})`);

      await prisma.transaction.create({
        data: {
          userId: session.user.id,
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

    return NextResponse.json({
      success: true,
      summary: {
        totalExpenses: expenses.length,
        created,
        skipped,
      },
      message: `Successfully backfilled ${created} transactions. Skipped ${skipped} existing transactions.`,
    });
  } catch (error) {
    console.error("Error backfilling transactions:", error);
    return NextResponse.json(
      { error: "Failed to backfill transactions", details: String(error) },
      { status: 500 }
    );
  }
}
