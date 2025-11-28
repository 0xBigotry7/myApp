import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
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

  // 1. Get Trips (Active > Upcoming > Recent)
  const now = new Date();

  const activeTrip = await prisma.trip.findFirst({
    where: {
      AND: [
        { OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }] },
        { startDate: { lte: now } },
        { endDate: { gte: now } }
      ]
    },
    include: { _count: { select: { expenses: true, activities: true, places: true } } }
  });

  const upcomingTrip = !activeTrip ? await prisma.trip.findFirst({
    where: {
      AND: [
        { OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }] },
        { startDate: { gt: now } }
      ]
    },
    orderBy: { startDate: 'asc' },
    include: { _count: { select: { expenses: true, activities: true, places: true } } }
  }) : null;

  const lastTrip = (!activeTrip && !upcomingTrip) ? await prisma.trip.findFirst({
    where: {
      OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }]
    },
    orderBy: { endDate: 'desc' },
    include: { _count: { select: { expenses: true, activities: true, places: true } } }
  }) : null;

  const tripStatus = (activeTrip ? 'active' : upcomingTrip ? 'upcoming' : 'past') as 'active' | 'upcoming' | 'past';

  // 2. Finance Summary
  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
  });

  // Simple currency conversion for display (USD base)
  const conversionRates: Record<string, number> = {
    USD: 1, EUR: 1.09, GBP: 1.27, JPY: 0.0067, CNY: 0.138, THB: 0.029,
  };

  const totalNetWorth = accounts.reduce((sum, acc) => {
    const rate = conversionRates[acc.currency] || 1;
    return sum + (acc.balance * rate);
  }, 0);

  const recentExpenses = await prisma.expense.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    take: 5,
    include: { trip: { select: { name: true } } },
  });

  // 3. Timeline / Life Events
  const recentMemory = await prisma.lifeEvent.findFirst({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
  });

  // 4. Map Stats - Fetch detailed destinations for the globe
  const visitedDestinations = await prisma.travelDestination.findMany({
    where: {
      userId: session.user.id,
      visitDate: { not: null },
      latitude: { not: 0 }, // Filter out invalid coords if any
      longitude: { not: 0 }
    },
    select: {
      id: true,
      city: true,
      country: true,
      latitude: true,
      longitude: true
    }
  });

  const visitedCountries = new Set(visitedDestinations.map(d => d.country)).size;

  // 5. Greeting Logic
  const hour = now.getHours();
  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 18) greeting = "Good Afternoon";

  const stats = {
    activeTrip,
    upcomingTrip,
    lastTrip,
    tripStatus,
    totalNetWorth,
    visitedCount: visitedCountries,
    recentExpenses,
    recentMemory,
    greeting,
    destinations: visitedDestinations
  };

  return (
    <>
      <Navbar />
      <DashboardClient
        user={session.user}
        stats={stats}
        t={t}
      />
    </>
  );
}
