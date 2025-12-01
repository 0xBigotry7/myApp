import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST - Calculate and apply rollover from previous month
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { targetMonth, targetYear } = body;

    // Calculate previous month
    let prevMonth = targetMonth - 1;
    let prevYear = targetYear;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear = targetYear - 1;
    }

    // Get previous month's budget
    const prevBudget = await prisma.budget.findUnique({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month: prevMonth,
          year: prevYear,
        },
      },
      include: {
        envelopes: true,
      },
    });

    if (!prevBudget) {
      return NextResponse.json({
        message: "No previous budget found",
        rollovers: {},
      });
    }

    // Calculate actual spending for previous month
    const startOfPrevMonth = new Date(prevYear, prevMonth - 1, 1);
    const endOfPrevMonth = new Date(prevYear, prevMonth, 0, 23, 59, 59);

    const prevTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startOfPrevMonth,
          lte: endOfPrevMonth,
        },
        amount: { lt: 0 },
      },
      select: {
        category: true,
        amount: true,
      },
    });

    const prevSpending: Record<string, number> = {};
    prevTransactions.forEach((t) => {
      prevSpending[t.category] = (prevSpending[t.category] || 0) + Math.abs(t.amount);
    });

    // Calculate rollovers per category
    const rollovers: Record<string, number> = {};
    prevBudget.envelopes.forEach((env) => {
      const spent = prevSpending[env.category] || 0;
      const remaining = env.allocated + env.rollover - spent;
      rollovers[env.category] = Math.max(0, remaining); // Don't carry over negative
    });

    // Get or create current month budget
    let currentBudget = await prisma.budget.findUnique({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month: targetMonth,
          year: targetYear,
        },
      },
    });

    if (!currentBudget) {
      currentBudget = await prisma.budget.create({
        data: {
          userId: session.user.id,
          month: targetMonth,
          year: targetYear,
          totalIncome: prevBudget.totalIncome,
          totalAllocated: 0,
        },
      });
    }

    // Update or create envelopes with rollover
    for (const [category, rollover] of Object.entries(rollovers)) {
      const prevEnvelope = prevBudget.envelopes.find((e) => e.category === category);
      if (!prevEnvelope) continue;

      await prisma.budgetEnvelope.upsert({
        where: {
          budgetId_category: {
            budgetId: currentBudget.id,
            category,
          },
        },
        update: {
          rollover,
        },
        create: {
          budgetId: currentBudget.id,
          category,
          allocated: prevEnvelope.allocated, // Copy allocation from previous month
          rollover,
          icon: prevEnvelope.icon,
          color: prevEnvelope.color,
        },
      });
    }

    // Update totalAllocated
    const updatedEnvelopes = await prisma.budgetEnvelope.findMany({
      where: { budgetId: currentBudget.id },
    });

    const newTotal = updatedEnvelopes.reduce((sum, e) => sum + e.allocated, 0);

    await prisma.budget.update({
      where: { id: currentBudget.id },
      data: { totalAllocated: newTotal },
    });

    return NextResponse.json({
      success: true,
      rollovers,
      message: `Applied rollover from ${prevMonth}/${prevYear}`,
    });
  } catch (error) {
    console.error("Error applying rollover:", error);
    return NextResponse.json(
      { error: "Failed to apply rollover" },
      { status: 500 }
    );
  }
}



