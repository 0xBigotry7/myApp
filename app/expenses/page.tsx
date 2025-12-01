import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import ExpensesOfflineWrapper from "@/components/ExpensesOfflineWrapper";
import OfflineIndicator from "@/components/OfflineIndicator";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get current month/year
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  // Calculate date range for stats (current month only for faster loading)
  const monthStart = new Date(currentYear, currentMonth - 1, 1);
  
  // Run database queries in parallel - simplified for faster load
  const [accounts, recentTransactions, monthlyStats, trips] = await Promise.all([
    // Active accounts
    prisma.account.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    
    // Load transactions for current month for accurate stats, plus recent ones for display
    prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        OR: [
          // Current month transactions (for accurate stats)
          { date: { gte: monthStart } },
          // Recent transactions regardless of month (for display)
          { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
        ]
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            color: true,
            currency: true,
          },
        },
        trip: {
          select: {
            id: true,
            name: true,
            destination: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 200, // Reduced for faster initial load
    }),
    
    // Get aggregated stats for current month (lightweight query)
    prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        date: { gte: monthStart },
      },
      _sum: { amount: true },
      _count: true,
    }),
    
    // Trips (only essential fields)
    prisma.trip.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      },
      select: {
        id: true,
        name: true,
        destination: true,
        startDate: true,
        endDate: true,
      },
      orderBy: {
        startDate: "desc",
      },
      take: 10,
    }),
  ]);

  // Prepare initial data for offline-first rendering
  const initialData = {
    accounts: JSON.parse(JSON.stringify(accounts)),
    transactions: JSON.parse(JSON.stringify(recentTransactions)),
    trips: JSON.parse(JSON.stringify(trips)),
    currentMonth,
    currentYear,
    // Pagination support
    hasMoreTransactions: recentTransactions.length >= 20,
    nextCursor: recentTransactions.length > 0 ? recentTransactions[recentTransactions.length - 1].id : null,
    // Monthly stats for quick display
    monthlyStats: {
      totalSpent: Math.abs(monthlyStats._sum.amount || 0),
      transactionCount: monthlyStats._count,
    },
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 bg-dot-pattern transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ExpensesOfflineWrapper initialData={initialData} />
        </div>
      </div>
      <OfflineIndicator />
    </>
  );
}
