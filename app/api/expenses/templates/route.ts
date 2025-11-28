import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET - Get expense templates (based on frequently used patterns)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get frequent patterns from transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: { gte: thirtyDaysAgo },
        merchantName: { not: null },
      },
      select: {
        merchantName: true,
        category: true,
        amount: true,
        accountId: true,
      },
      orderBy: { date: "desc" },
      take: 200,
    });

    // Group by merchant + category pattern
    const patternMap = new Map<string, {
      merchantName: string;
      category: string;
      amounts: number[];
      accountId: string;
      count: number;
    }>();

    transactions.forEach((t) => {
      if (t.merchantName) {
        const key = `${t.merchantName.toLowerCase()}_${t.category}`;
        const existing = patternMap.get(key);
        if (existing) {
          existing.amounts.push(Math.abs(t.amount));
          existing.count++;
        } else {
          patternMap.set(key, {
            merchantName: t.merchantName,
            category: t.category,
            amounts: [Math.abs(t.amount)],
            accountId: t.accountId,
            count: 1,
          });
        }
      }
    });

    // Create templates from frequent patterns (used 3+ times)
    const templates = Array.from(patternMap.values())
      .filter(p => p.count >= 3)
      .map(p => {
        // Calculate average amount
        const avgAmount = p.amounts.reduce((sum, amt) => sum + amt, 0) / p.amounts.length;
        // Round to nearest 5 or 10
        const roundedAmount = avgAmount < 50 
          ? Math.round(avgAmount / 5) * 5 
          : Math.round(avgAmount / 10) * 10;

        return {
          id: `${p.merchantName}_${p.category}`,
          name: `${p.merchantName} - ${p.category}`,
          merchantName: p.merchantName,
          category: p.category,
          amount: roundedAmount,
          accountId: p.accountId,
          usageCount: p.count,
        };
      })
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}



