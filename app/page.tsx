import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/locale-server";
import { getTranslations } from "@/lib/i18n";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const locale = await getServerLocale();
  const t = getTranslations(locale);
  const now = new Date();

  // Run ALL database queries in parallel for maximum performance
  const [
    activeTrip,
    upcomingTrip,
    lastTrip,
    accounts,
    recentExpenses,
    recentMemory,
    visitedDestinations
  ] = await Promise.all([
    // 1. Active trip (currently happening)
    prisma.trip.findFirst({
      where: {
        AND: [
          { OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }] },
          { startDate: { lte: now } },
          { endDate: { gte: now } }
        ]
      },
      include: { _count: { select: { transactions: true, activities: true, places: true } } }
    }),

    // 2. Upcoming trip
    prisma.trip.findFirst({
      where: {
        AND: [
          { OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }] },
          { startDate: { gt: now } }
        ]
      },
      orderBy: { startDate: 'asc' },
      include: { _count: { select: { transactions: true, activities: true, places: true } } }
    }),

    // 3. Most recent past trip
    prisma.trip.findFirst({
      where: {
        OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }]
      },
      orderBy: { endDate: 'desc' },
      include: { _count: { select: { transactions: true, activities: true, places: true } } }
    }),

    // 4. Finance accounts
    prisma.account.findMany({
      where: { userId: session.user.id },
      select: { balance: true, currency: true } // Only select needed fields
    }),

    // 5. Recent expenses (now using transactions)
    prisma.transaction.findMany({
      where: { userId: session.user.id, amount: { lt: 0 } },
      orderBy: { date: 'desc' },
      take: 5,
      select: {
        id: true,
        amount: true,
        category: true,
        description: true,
        date: true,
        trip: { select: { name: true } }
      }
    }),

    // 6. Recent memory
    prisma.lifeEvent.findFirst({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      select: { title: true }
    }),

    // 7. Visited destinations
    prisma.travelDestination.findMany({
      where: {
        userId: session.user.id,
        visitDate: { not: null },
        latitude: { not: 0 },
        longitude: { not: 0 }
      },
      select: {
        id: true,
        city: true,
        country: true,
        latitude: true,
        longitude: true
      }
    })
  ]);

  // Determine which trip to feature (prioritize: active > upcoming > last)
  const featuredTrip = activeTrip || (!activeTrip ? upcomingTrip : null) || (!activeTrip && !upcomingTrip ? lastTrip : null);
  const tripStatus = (activeTrip ? 'active' : upcomingTrip && !activeTrip ? 'upcoming' : 'past') as 'active' | 'upcoming' | 'past';

  // Convert all account balances to USD for accurate net worth calculation
  const { convertCurrency } = await import("@/lib/currency");
  const totalNetWorth = accounts.reduce((sum, acc) => {
    const amountInUSD = convertCurrency(acc.balance, acc.currency, "USD");
    return sum + amountInUSD;
  }, 0);

  const visitedCountries = new Set(visitedDestinations.map(d => d.country)).size;

  // 5. Greeting Logic
  const hour = now.getHours();
  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 18) greeting = "Good Afternoon";

  const stats = {
    activeTrip,
    upcomingTrip: activeTrip ? null : upcomingTrip,
    lastTrip: (activeTrip || upcomingTrip) ? null : lastTrip,
    tripStatus,
    totalNetWorth,
    visitedCount: visitedCountries,
    recentExpenses,
    recentMemory,
    greeting,
    destinations: visitedDestinations
  };

  return (
      <DashboardClient
        user={session.user}
        stats={stats}
        t={t}
      />
  );
}
