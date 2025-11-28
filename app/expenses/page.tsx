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
  
  // Run all database queries in parallel for better performance
  const [budget, accounts, recentTransactions, monthlyStats, trips, recurringTransactions] = await Promise.all([
    // Budget for current month
    prisma.budget.findUnique({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month: currentMonth,
          year: currentYear,
        },
      },
      include: {
        envelopes: true,
      },
    }),
    
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
    
    // Only load first 20 transactions for initial display (paginated)
    prisma.transaction.findMany({
      where: {
        userId: session.user.id,
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
      take: 20, // Only load 20 initially - much faster!
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
      take: 10, // Only recent trips
    }),
    
    // Recurring transactions
    prisma.recurringTransaction.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: {
        nextDate: "asc",
      },
      take: 10, // Limit for initial load
    }),
  ]);

  // Prepare initial data for offline-first rendering
  const initialData = {
    budget: budget ? JSON.parse(JSON.stringify(budget)) : null,
    accounts: JSON.parse(JSON.stringify(accounts)),
    transactions: JSON.parse(JSON.stringify(recentTransactions)),
    expenses: [],
    recurringTransactions: JSON.parse(JSON.stringify(recurringTransactions)),
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
