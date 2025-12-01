import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET spending trends - month comparison, category trends, velocity
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const months = parseInt(searchParams.get("months") || "6");

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get data for the last N months
    const monthlyData: Array<{
      month: number;
      year: number;
      label: string;
      totalSpent: number;
      totalIncome: number;
      byCategory: Record<string, number>;
    }> = [];

    for (let i = months - 1; i >= 0; i--) {
      let targetMonth = currentMonth - i;
      let targetYear = currentYear;

      while (targetMonth < 0) {
        targetMonth += 12;
        targetYear -= 1;
      }

      const startOfMonth = new Date(targetYear, targetMonth, 1);
      const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: session.user.id,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        select: {
          amount: true,
          category: true,
        },
      });

      const byCategory: Record<string, number> = {};
      let totalSpent = 0;
      let totalIncome = 0;

      transactions.forEach((t) => {
        if (t.amount < 0) {
          totalSpent += Math.abs(t.amount);
          byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount);
        } else {
          totalIncome += t.amount;
        }
      });

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      monthlyData.push({
        month: targetMonth + 1,
        year: targetYear,
        label: monthNames[targetMonth],
        totalSpent,
        totalIncome,
        byCategory,
      });
    }

    // Calculate month-over-month comparison
    const currentMonthData = monthlyData[monthlyData.length - 1];
    const lastMonthData = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;

    const monthComparison = lastMonthData ? {
      spentChange: currentMonthData.totalSpent - lastMonthData.totalSpent,
      spentChangePercent: lastMonthData.totalSpent > 0 
        ? ((currentMonthData.totalSpent - lastMonthData.totalSpent) / lastMonthData.totalSpent) * 100 
        : 0,
      incomeChange: currentMonthData.totalIncome - lastMonthData.totalIncome,
      categoryChanges: Object.keys(currentMonthData.byCategory).map((cat) => ({
        category: cat,
        current: currentMonthData.byCategory[cat] || 0,
        previous: lastMonthData.byCategory[cat] || 0,
        change: (currentMonthData.byCategory[cat] || 0) - (lastMonthData.byCategory[cat] || 0),
      })).sort((a, b) => Math.abs(b.change) - Math.abs(a.change)),
    } : null;

    // Calculate spending velocity for current month
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyAverage = currentMonthData.totalSpent / dayOfMonth;
    const projectedMonthTotal = dailyAverage * daysInMonth;

    // Get average from past months
    const avgMonthlySpend = monthlyData.slice(0, -1).reduce((sum, m) => sum + m.totalSpent, 0) / Math.max(1, monthlyData.length - 1);

    // Get top categories with trends
    const allCategories = new Set<string>();
    monthlyData.forEach((m) => Object.keys(m.byCategory).forEach((c) => allCategories.add(c)));

    const categoryTrends = Array.from(allCategories).map((category) => {
      const values = monthlyData.map((m) => m.byCategory[category] || 0);
      const current = values[values.length - 1];
      const average = values.slice(0, -1).reduce((a, b) => a + b, 0) / Math.max(1, values.length - 1);
      
      return {
        category,
        current,
        average: Math.round(average),
        trend: values,
        changeFromAverage: average > 0 ? ((current - average) / average) * 100 : 0,
      };
    }).sort((a, b) => b.current - a.current);

    return NextResponse.json({
      monthlyData,
      monthComparison,
      velocity: {
        dailyAverage: Math.round(dailyAverage),
        projectedMonthTotal: Math.round(projectedMonthTotal),
        avgMonthlySpend: Math.round(avgMonthlySpend),
        onTrack: projectedMonthTotal <= avgMonthlySpend * 1.1, // Within 10% of average
        daysRemaining: daysInMonth - dayOfMonth,
        burnRate: dailyAverage,
      },
      categoryTrends: categoryTrends.slice(0, 10),
      summary: {
        totalSpentThisMonth: currentMonthData.totalSpent,
        totalIncomeThisMonth: currentMonthData.totalIncome,
        netThisMonth: currentMonthData.totalIncome - currentMonthData.totalSpent,
      },
    });
  } catch (error) {
    console.error("Error fetching spending trends:", error);
    return NextResponse.json(
      { error: "Failed to fetch spending trends" },
      { status: 500 }
    );
  }
}



