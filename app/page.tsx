import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import TripCard from "@/components/TripCard";
import { getServerLocale } from "@/lib/locale-server";
import { getTranslations } from "@/lib/i18n";

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const locale = await getServerLocale();
  const t = getTranslations(locale);

  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id },
    include: {
      expenses: true,
      budgetCategories: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const tripsWithStats = trips.map((trip) => {
    const totalSpent = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = trip.totalBudget - totalSpent;
    const percentUsed = (totalSpent / trip.totalBudget) * 100;

    return { ...trip, totalSpent, remaining, percentUsed };
  });

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{t.myTrips}</h1>
              <p className="text-gray-600">{t.planTrackManage}</p>
            </div>
            <Link
              href="/trips/new"
              className="inline-flex items-center gap-2 bg-gradient-blue-pink text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
            >
              <span className="text-xl">+</span>
              {t.planTrip}
            </Link>
          </div>

          {tripsWithStats.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-200">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">✈️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.noTripsYet}</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {t.startPlanningAdventure}
              </p>
              <Link
                href="/trips/new"
                className="inline-flex items-center gap-2 bg-gradient-blue-pink text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
              >
                <span className="text-xl">+</span>
                {t.createFirstTrip}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tripsWithStats.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
