import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET current month budget with envelopes and spending data
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    // Get or create budget for the month
    let budget = await prisma.budget.findUnique({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month,
          year,
        },
      },
      include: {
        envelopes: {
          orderBy: { category: "asc" },
        },
      },
    });

    // Calculate actual spending per category for this month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        amount: { lt: 0 }, // Only expenses (negative amounts)
      },
      select: {
        category: true,
        amount: true,
      },
    });

    // Group spending by category
    const spendingByCategory: Record<string, number> = {};
    transactions.forEach((t) => {
      const cat = t.category;
      spendingByCategory[cat] = (spendingByCategory[cat] || 0) + Math.abs(t.amount);
    });

    // Calculate totals
    const totalSpent = Object.values(spendingByCategory).reduce((a, b) => a + b, 0);

    // If budget exists, update envelope spent values
    if (budget) {
      const updatedEnvelopes = budget.envelopes.map((env) => ({
        ...env,
        spent: spendingByCategory[env.category] || 0,
      }));

      return NextResponse.json({
        ...budget,
        envelopes: updatedEnvelopes,
        totalSpent,
        spendingByCategory,
      });
    }

    // Return null if no budget set up yet
    return NextResponse.json({
      budget: null,
      totalSpent,
      spendingByCategory,
      month,
      year,
    });
  } catch (error) {
    console.error("Error fetching budget:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget" },
      { status: 500 }
    );
  }
}

// POST - Create or update budget with envelopes
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { month, year, totalIncome, envelopes } = body;

    if (!month || !year) {
      return NextResponse.json(
        { error: "Month and year are required" },
        { status: 400 }
      );
    }

    const totalAllocated = envelopes?.reduce(
      (sum: number, env: any) => sum + (env.allocated || 0),
      0
    ) || 0;

    // Upsert budget
    const budget = await prisma.budget.upsert({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month,
          year,
        },
      },
      update: {
        totalIncome: totalIncome || 0,
        totalAllocated,
      },
      create: {
        userId: session.user.id,
        month,
        year,
        totalIncome: totalIncome || 0,
        totalAllocated,
      },
    });

    // Update or create envelopes
    if (envelopes && Array.isArray(envelopes)) {
      for (const env of envelopes) {
        if (!env.category) continue;

        await prisma.budgetEnvelope.upsert({
          where: {
            budgetId_category: {
              budgetId: budget.id,
              category: env.category,
            },
          },
          update: {
            allocated: env.allocated || 0,
            rollover: env.rollover || 0,
            icon: env.icon,
            color: env.color,
          },
          create: {
            budgetId: budget.id,
            category: env.category,
            allocated: env.allocated || 0,
            rollover: env.rollover || 0,
            icon: env.icon,
            color: env.color,
          },
        });
      }
    }

    // Fetch updated budget with envelopes
    const updatedBudget = await prisma.budget.findUnique({
      where: { id: budget.id },
      include: {
        envelopes: {
          orderBy: { category: "asc" },
        },
      },
    });

    return NextResponse.json(updatedBudget);
  } catch (error) {
    console.error("Error creating/updating budget:", error);
    return NextResponse.json(
      { error: "Failed to save budget" },
      { status: 500 }
    );
  }
}

// DELETE - Remove an envelope from budget
export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const envelopeId = searchParams.get("envelopeId");

    if (!envelopeId) {
      return NextResponse.json(
        { error: "Envelope ID is required" },
        { status: 400 }
      );
    }

    // Verify envelope belongs to user's budget
    const envelope = await prisma.budgetEnvelope.findUnique({
      where: { id: envelopeId },
      include: {
        budget: true,
      },
    });

    if (!envelope || envelope.budget.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Envelope not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.budgetEnvelope.delete({
      where: { id: envelopeId },
    });

    // Update totalAllocated in budget
    const remainingEnvelopes = await prisma.budgetEnvelope.findMany({
      where: { budgetId: envelope.budgetId },
    });

    const newTotal = remainingEnvelopes.reduce((sum, e) => sum + e.allocated, 0);

    await prisma.budget.update({
      where: { id: envelope.budgetId },
      data: { totalAllocated: newTotal },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting envelope:", error);
    return NextResponse.json(
      { error: "Failed to delete envelope" },
      { status: 500 }
    );
  }
}

