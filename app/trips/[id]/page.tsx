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
      // Legacy expenses (for migration compatibility - will be removed once fully migrated)
      expenses: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { date: "desc" },
        take: 10,
      },
      // Unified transactions - limit to 10 initially
      transactions: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          account: {
            select: { id: true, name: true, currency: true },
          },
        },
        orderBy: { date: "desc" },
        take: 10,
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
          expenses: true,
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

  // Calculate total spent (combining legacy expenses and transactions during migration)
  // TODO: Remove legacy expense calculation once migration is complete
  const legacyExpenseTotal = trip.expenses.reduce((sum, exp) => sum + convertToUSD(exp.amount, exp.currency), 0);
  const transactionTotal = trip.transactions.reduce((sum, tx) => {
    const currency = tx.currency || tx.account.currency;
    return sum + convertToUSD(Math.abs(tx.amount), currency);
  }, 0);
  
  // Use the larger to avoid double-counting during migration period
  const totalSpent = Math.max(legacyExpenseTotal, transactionTotal);
  const remaining = trip.totalBudget - totalSpent;
  const percentUsed = (totalSpent / trip.totalBudget) * 100;

  // Calculate spending by category (combining legacy and new during migration)
  const categorySpending = trip.budgetCategories.map((bc) => {
    const legacySpent = trip.expenses
      .filter((exp) => exp.category === bc.category)
      .reduce((sum, exp) => sum + convertToUSD(exp.amount, exp.currency), 0);
    
    const txSpent = trip.transactions
      .filter((tx) => tx.category === bc.category)
      .reduce((sum, tx) => {
        const currency = tx.currency || tx.account.currency;
        return sum + convertToUSD(Math.abs(tx.amount), currency);
      }, 0);
    
    // Use the larger to avoid double-counting during migration
    const spent = Math.max(legacySpent, txSpent);
    
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
            trip={trip}
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
