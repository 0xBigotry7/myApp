import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import ExpensesClient from "@/components/ExpensesClient";
import { getServerLocale } from "@/lib/locale-server";
import { getTranslations } from "@/lib/i18n";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const locale = await getServerLocale();
  const t = getTranslations(locale);

  // Get current month/year
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Get or create budget for current month
  let budget = await prisma.budget.findUnique({
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
  });

  // Get user's accounts
  const accounts = await prisma.account.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get recent transactions (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Fetch ONLY non-trip transactions to avoid duplication/incorrect amounts
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      isTripRelated: false, 
      date: {
        gte: ninetyDaysAgo,
      },
    },
    include: {
      account: true,
    },
    orderBy: {
      date: "desc",
    },
    take: 200,
  });

  // Fetch trip expenses (which have correct currency info)
  const expenses = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: ninetyDaysAgo,
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Get trips for context
  const trips = await prisma.trip.findMany({
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
    }
  });

  // Get recurring transactions
  const recurringTransactions = await prisma.recurringTransaction.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
    },
    orderBy: {
      nextDate: "asc",
    },
  });

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-zinc-50 bg-dot-pattern">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ExpensesClient
            budget={budget ? JSON.parse(JSON.stringify(budget)) : null}
            accounts={JSON.parse(JSON.stringify(accounts))}
            transactions={JSON.parse(JSON.stringify(transactions))}
            expenses={JSON.parse(JSON.stringify(expenses))}
            recurringTransactions={JSON.parse(JSON.stringify(recurringTransactions))}
            trips={JSON.parse(JSON.stringify(trips))}
            currentMonth={currentMonth}
            currentYear={currentYear}
          />
        </div>
      </div>
    </>
  );
}
