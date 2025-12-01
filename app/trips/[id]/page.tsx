import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import TripPageTabs from "@/components/TripPageTabs";
import TripHeader from "@/components/TripHeader";
import { getTranslations } from "@/lib/i18n";
import { getServerLocale } from "@/lib/locale-server";
import { getHouseholdUserIds } from "@/lib/household";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getServerLocale();
  const t = getTranslations(locale);
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  // Optimized query - only load initial data, pagination handled client-side
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      budgetCategories: true,
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
        }
      },
      // Transactions (Expense table deprecated)
      transactions: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          account: {
            select: { id: true, name: true, currency: true },
          },
        },
        orderBy: { date: "desc" },
        // Load all transactions for the trip (no limit)
      },
      activities: {
        orderBy: [{ date: "asc" }, { order: "asc" }],
        take: 20,
      },
      posts: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { timestamp: "desc" },
        take: 10,
      },
      // Get counts for pagination info
      _count: {
        select: {
          transactions: true,
          posts: true,
          activities: true,
        }
      }
    },
  });

  // Check if user has access (is owner OR is a member)
  const hasAccess = trip && (
    trip.ownerId === session.user.id ||
    trip.members.some(m => m.userId === session.user.id)
  );

  if (!trip || !hasAccess) {
    notFound();
  }

  // Currency conversion rates to USD
  const conversionRates: Record<string, number> = {
    USD: 1,
    EUR: 1.09,
    GBP: 1.27,
    JPY: 0.0067,
    CNY: 0.138,
    THB: 0.029,
  };

  // Helper function to convert any currency to USD
  const convertToUSD = (amount: number, currency: string): number => {
    const rate = conversionRates[currency] || 1;
    return amount * rate;
  };

  // Convert transactions to expense format for display (Expense table deprecated)
  const allExpenses = trip.transactions
    .filter((tx: any) => tx.amount < 0) // Only show expenses (negative amounts)
    .map((tx: any) => ({
      id: tx.id,
      amount: Math.abs(tx.amount), // Expenses are positive amounts
      category: tx.category || "Other",
      currency: tx.currency || tx.account?.currency || "USD",
      date: tx.date,
      note: tx.description || tx.merchantName || null,
      location: tx.location || trip.destination || null,
      receiptUrl: null,
      isTransaction: true, // Flag to identify as transaction for deletion/editing
      accountId: tx.accountId, // Include for editing
      user: tx.user || { name: "Unknown", email: "" },
    }))
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate total spent from merged expenses
  const totalSpent = allExpenses.reduce((sum, exp) => {
    return sum + convertToUSD(exp.amount, exp.currency);
  }, 0);
  const remaining = trip.totalBudget - totalSpent;
  const percentUsed = (totalSpent / trip.totalBudget) * 100;

  // Calculate spending by category from merged expenses
  const categorySpending = trip.budgetCategories.map((bc) => {
    const spent = allExpenses
      .filter((exp) => exp.category === bc.category)
      .reduce((sum, exp) => sum + convertToUSD(exp.amount, exp.currency), 0);
    
    return {
      category: bc.category,
      budget: bc.budgetAmount,
      spent,
      remaining: bc.budgetAmount - spent,
      percentUsed: (spent / bc.budgetAmount) * 100,
    };
  });

  // Get all household users for user badges in timeline
  const householdUserIds = await getHouseholdUserIds();
  const householdUsers = await prisma.user.findMany({
    where: {
      id: { in: householdUserIds },
    },
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Hero Header with Edit functionality */}
      <TripHeader trip={trip} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        {/* Tabbed Content */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <TripPageTabs
            trip={{
              ...trip,
              expenses: allExpenses, // Pass merged expenses including transactions
            }}
            categorySpending={categorySpending}
            householdUsers={householdUsers}
            currentUserEmail={session.user.email || undefined}
            locale={locale}
            totalSpent={totalSpent}
            remaining={remaining}
            percentUsed={percentUsed}
            counts={trip._count}
          />
        </div>
      </div>
    </main>
  );
}
