import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import TripPageTabs from "@/components/TripPageTabs";
import { getTranslations } from "@/lib/i18n";
import { getServerLocale } from "@/lib/locale-server";
import { getHouseholdUserIds } from "@/lib/household";
import { MapPin, Calendar, Users, Wallet } from "lucide-react";
import Image from "next/image";

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

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      budgetCategories: true,
      members: {
        include: {
          user: true,
        }
      },
      // Legacy expenses (will be phased out)
      expenses: {
        include: {
          user: true,
        },
        orderBy: { date: "desc" },
      },
      // New unified transactions
      transactions: {
        include: {
          user: true,
          account: {
            select: {
              id: true,
              name: true,
              currency: true,
            },
          },
        },
        orderBy: { date: "desc" },
      },
      activities: {
        orderBy: [{ date: "asc" }, { order: "asc" }],
      },
      posts: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
      },
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

  // Calculate total spent from both legacy expenses AND new transactions
  const legacyExpenseTotal = trip.expenses.reduce((sum, exp) => sum + convertToUSD(exp.amount, exp.currency), 0);
  const transactionTotal = trip.transactions.reduce((sum, tx) => {
    // Transactions are stored as negative for expenses
    const currency = tx.currency || tx.account.currency;
    return sum + convertToUSD(Math.abs(tx.amount), currency);
  }, 0);
  
  // Use the larger of the two to avoid double-counting during migration
  // Once migration is complete, this will just be transactionTotal
  const totalSpent = Math.max(legacyExpenseTotal, transactionTotal);
  const remaining = trip.totalBudget - totalSpent;
  const percentUsed = (totalSpent / trip.totalBudget) * 100;

  // Calculate spending by category (combining both sources)
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
    
    // Use the larger to avoid double-counting
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
    <main className="min-h-screen bg-zinc-50 pb-20">
      {/* Hero Header */}
      <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden bg-zinc-900">
        {trip.destinationImageUrl ? (
          <Image
            src={trip.destinationImageUrl}
            alt={trip.destination}
            fill
            className="object-cover opacity-60"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-white">
                <Users className="w-3 h-3" />
                {trip.members.length} Traveler{trip.members.length !== 1 && 's'}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4 shadow-sm">
              {trip.name || trip.destination}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-zinc-300 text-sm sm:text-base font-medium">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-zinc-400" />
                {trip.destination}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-zinc-400" />
                {format(new Date(trip.startDate), "MMM d")} - {format(new Date(trip.endDate), "MMM d, yyyy")}
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-zinc-400" />
                Budget: ${trip.totalBudget.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        {/* Tabbed Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden">
          <TripPageTabs
            trip={trip}
            categorySpending={categorySpending}
            householdUsers={householdUsers}
            currentUserEmail={session.user.email || undefined}
            locale={locale}
            totalSpent={totalSpent}
            remaining={remaining}
            percentUsed={percentUsed}
          />
        </div>
      </div>
    </main>
  );
}
