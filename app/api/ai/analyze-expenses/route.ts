import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeExpenses } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { differenceInDays } from "date-fns";

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

    // Fetch trip with expenses and budget categories
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        expenses: true,
        budgetCategories: true,
      },
    });

    if (!trip || trip.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Trip not found or unauthorized" },
        { status: 404 }
      );
    }

    // Calculate total spent
    const totalSpent = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate category breakdown
    const categoryBreakdown = trip.budgetCategories.map((budgetCat) => {
      const categorySpent = trip.expenses
        .filter((exp) => exp.category === budgetCat.category)
        .reduce((sum, exp) => sum + exp.amount, 0);

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
