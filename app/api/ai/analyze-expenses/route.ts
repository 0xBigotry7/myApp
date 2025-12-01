import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeExpenses } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { differenceInDays } from "date-fns";
import { convertCurrency } from "@/lib/currency";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tripId } = body;

    if (!tripId) {
      return NextResponse.json(
        { error: "Missing tripId" },
        { status: 400 }
      );
    }

    // Fetch trip with transactions and budget categories
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        transactions: {
          include: {
            account: { select: { currency: true } },
          },
        },
        budgetCategories: true,
      },
    });

    if (!trip || trip.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Trip not found or unauthorized" },
        { status: 404 }
      );
    }

    // Calculate total spent from transactions (convert to USD)
    const totalSpent = trip.transactions.reduce((sum, tx) => {
      const currency = tx.currency || tx.account?.currency || "USD";
      const amountUSD = convertCurrency(Math.abs(tx.amount), currency, "USD");
      return sum + amountUSD;
    }, 0);

    // Calculate category breakdown from transactions
    const categoryBreakdown = trip.budgetCategories.map((budgetCat) => {
      const categorySpent = trip.transactions
        .filter((tx) => tx.category === budgetCat.category)
        .reduce((sum, tx) => {
          const currency = tx.currency || tx.account?.currency || "USD";
          const amountUSD = convertCurrency(Math.abs(tx.amount), currency, "USD");
          return sum + amountUSD;
        }, 0);

      return {
        category: budgetCat.category,
        spent: categorySpent,
        budget: budgetCat.budgetAmount,
      };
    });

    // Calculate days remaining
    const today = new Date();
    const endDate = new Date(trip.endDate);
    const daysRemaining = Math.max(0, differenceInDays(endDate, today));

    // Get AI insights
    const insights = await analyzeExpenses(
      trip.totalBudget,
      totalSpent,
      categoryBreakdown,
      daysRemaining
    );

    return NextResponse.json({
      success: true,
      insights,
      summary: {
        totalBudget: trip.totalBudget,
        totalSpent,
        remaining: trip.totalBudget - totalSpent,
        daysRemaining,
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error("Error analyzing expenses:", error);
    return NextResponse.json(
      { error: "Failed to analyze expenses" },
      { status: 500 }
    );
  }
}
