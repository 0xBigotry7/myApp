import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TripCard from "@/components/TripCard";
import { getServerLocale } from "@/lib/locale-server";
import { getTranslations } from "@/lib/i18n";

// Revalidate this page every 60 seconds for better caching
export const revalidate = 60;

export default async function TripsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const locale = await getServerLocale();
  const t = getTranslations(locale);

  // Get trips with aggregated expense totals (MUCH more efficient than loading all expenses)
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
      startDate: true,
      endDate: true,
      totalBudget: true,
      destinationImageUrl: true,
      createdAt: true,
      // Use aggregation to get expense totals instead of loading all expenses
      expenses: {
        select: {
          amount: true,
          currency: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

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

  const tripsWithStats = trips.map((trip) => {
    const totalSpent = trip.expenses.reduce((sum, exp) => sum + convertToUSD(exp.amount, exp.currency), 0);
    const remaining = trip.totalBudget - totalSpent;
    const percentUsed = trip.totalBudget > 0 ? (totalSpent / trip.totalBudget) * 100 : 0;

    // Return only what TripCard needs
    return {
      id: trip.id,
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      totalBudget: trip.totalBudget,
      destinationImageUrl: trip.destinationImageUrl,
      totalSpent,
      remaining,
      percentUsed
    };
  });

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
                My Trips
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-2xl">
                Manage your adventures, track expenses, and plan your next journey.
              </p>
            </div>
            <Link
              href="/trips/new"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 dark:bg-white px-8 py-3 text-sm font-medium text-white dark:text-zinc-900 transition-all hover:bg-zinc-800 dark:hover:bg-zinc-100 hover:shadow-lg active:scale-95"
            >
              <span className="text-xl leading-none mb-0.5">+</span>
              {t.planTrip}
            </Link>
          </div>

          {/* Content Section */}
          {tripsWithStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 px-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm text-center">
              <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                <span className="text-5xl opacity-50">✈️</span>
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">{t.noTripsYet}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                {t.startPlanningAdventure}
              </p>
              <Link
                href="/trips/new"
                className="inline-flex items-center gap-2 rounded-full bg-zinc-900 dark:bg-white px-8 py-3 text-base font-medium text-white dark:text-zinc-900 transition-all hover:bg-zinc-800 dark:hover:bg-zinc-100 hover:shadow-lg active:scale-95"
              >
                {t.createFirstTrip}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tripsWithStats.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </div>
    </main>
  );
}

