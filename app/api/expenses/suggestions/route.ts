import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// This route now uses only transactions (Expense table deprecated)
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
        date: { gte: thirtyDaysAgo },
      },
      select: {
        merchantName: true,
        category: true,
        amount: true,
        location: true,
        description: true,
      },
      orderBy: { date: "desc" },
      take: 150,
    });

    // Extract unique merchants with frequency
    const merchantMap = new Map<string, { count: number; lastAmount: number; category: string }>();
    
    recentTransactions.forEach((t) => {
      const merchantName = t.merchantName || t.location || t.description;
      if (merchantName) {
        const existing = merchantMap.get(merchantName);
        if (existing) {
          existing.count++;
        } else {
          merchantMap.set(merchantName, {
            count: 1,
            lastAmount: Math.abs(t.amount),
            category: t.category,
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

    const categories = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get common amounts (rounded to nearest 5 or 10)
    const amounts = recentTransactions
      .map((t) => Math.abs(t.amount))
      .filter((amt) => amt > 0)
      .map((amt) => {
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
