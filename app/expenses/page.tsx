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
  
  // Calculate date range once
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Run all database queries in parallel for better performance
  const [budget, accounts, transactions, trips, recurringTransactions] = await Promise.all([
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
    
    prisma.account.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    
    prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: ninetyDaysAgo,
        },
      },
      include: {
        account: true,
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
      take: 300,
    }),
    
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
    }),
    
    prisma.recurringTransaction.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: {
        nextDate: "asc",
      },
    }),
  ]);

  // Prepare initial data for offline-first rendering
  const initialData = {
    budget: budget ? JSON.parse(JSON.stringify(budget)) : null,
    accounts: JSON.parse(JSON.stringify(accounts)),
    transactions: JSON.parse(JSON.stringify(transactions)),
    expenses: [],
    recurringTransactions: JSON.parse(JSON.stringify(recurringTransactions)),
    trips: JSON.parse(JSON.stringify(trips)),
    currentMonth,
    currentYear,
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
