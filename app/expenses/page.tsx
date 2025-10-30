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

  // Get recent transactions (last 30 days, ONLY non-trip-related)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      isTripRelated: false, // ONLY show regular expenses, not trip expenses
      date: {
        gte: thirtyDaysAgo,
      },
    },
    include: {
      account: true,
    },
    orderBy: {
      date: "desc",
    },
    take: 50,
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
      <div className="hidden md:block">
        <Navbar />
      </div>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8">
          <ExpensesClient
            budget={budget ? JSON.parse(JSON.stringify(budget)) : null}
            accounts={JSON.parse(JSON.stringify(accounts))}
            transactions={JSON.parse(JSON.stringify(transactions))}
            recurringTransactions={JSON.parse(JSON.stringify(recurringTransactions))}
            currentMonth={currentMonth}
            currentYear={currentYear}
          />
        </div>
      </div>
    </>
  );
}
