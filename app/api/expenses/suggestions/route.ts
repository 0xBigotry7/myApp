import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get recent merchants (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        merchantName: { not: null },
        date: { gte: thirtyDaysAgo },
      },
      select: {
        merchantName: true,
        category: true,
        amount: true,
      },
      orderBy: { date: "desc" },
      take: 100,
    });

    // Get recent expenses
    const recentExpenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        location: { not: null },
        date: { gte: thirtyDaysAgo },
      },
      select: {
        location: true,
        category: true,
        amount: true,
      },
      orderBy: { date: "desc" },
      take: 50,
    });

    // Extract unique merchants with frequency
    const merchantMap = new Map<string, { count: number; lastAmount: number; category: string }>();
    
    recentTransactions.forEach((t) => {
      if (t.merchantName) {
        const existing = merchantMap.get(t.merchantName);
        if (existing) {
          existing.count++;
        } else {
          merchantMap.set(t.merchantName, {
            count: 1,
            lastAmount: Math.abs(t.amount),
            category: t.category,
          });
        }
      }
    });

    recentExpenses.forEach((e) => {
      if (e.location) {
        const existing = merchantMap.get(e.location);
        if (existing) {
          existing.count++;
        } else {
          merchantMap.set(e.location, {
            count: 1,
            lastAmount: e.amount,
            category: e.category,
          });
        }
      }
    });

    const merchants = Array.from(merchantMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Extract category frequency
    const categoryMap = new Map<string, number>();
    
    recentTransactions.forEach((t) => {
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + 1);
    });

    recentExpenses.forEach((e) => {
      categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + 1);
    });

    const categories = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get common amounts (rounded to nearest 5 or 10)
    const amounts = [...recentTransactions, ...recentExpenses]
      .map((t) => Math.abs(t.amount))
      .filter((amt) => amt > 0)
      .map((amt) => {
        // Round to nearest 5 for amounts < 50, nearest 10 for larger amounts
        if (amt < 50) {
          return Math.round(amt / 5) * 5;
        }
        return Math.round(amt / 10) * 10;
      });

    const amountFrequency = new Map<number, number>();
    amounts.forEach((amt) => {
      amountFrequency.set(amt, (amountFrequency.get(amt) || 0) + 1);
    });

    const commonAmounts = Array.from(amountFrequency.entries())
      .map(([amount, count]) => ({ amount, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((item) => item.amount)
      .sort((a, b) => a - b);

    return NextResponse.json({
      merchants,
      categories,
      commonAmounts,
    });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}



