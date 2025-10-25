import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import ExpenseList from "@/components/ExpenseList";
import BudgetChart from "@/components/BudgetChart";
import TripTabs from "@/components/TripTabs";
import ItineraryView from "@/components/ItineraryView";
import ExpenseInsights from "@/components/ExpenseInsights";
import { getTranslations, translateCategory } from "@/lib/i18n";
import { getServerLocale } from "@/lib/locale-server";

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
      members: true,
      expenses: {
        include: {
          user: true,
        },
        orderBy: { date: "desc" },
      },
      activities: {
        orderBy: [{ date: "asc" }, { order: "asc" }],
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

  const totalSpent = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = trip.totalBudget - totalSpent;
  const percentUsed = (totalSpent / trip.totalBudget) * 100;

  // Calculate spending by category
  const categorySpending = trip.budgetCategories.map((bc) => {
    const spent = trip.expenses
      .filter((exp) => exp.category === bc.category)
      .reduce((sum, exp) => sum + exp.amount, 0);
    return {
      category: bc.category,
      budget: bc.budgetAmount,
      spent,
      remaining: bc.budgetAmount - spent,
      percentUsed: (spent / bc.budgetAmount) * 100,
    };
  });

  // Daily spending for trend
  const expensesByDate = trip.expenses.reduce((acc, exp) => {
    const dateKey = format(new Date(exp.date), "yyyy-MM-dd");
    acc[dateKey] = (acc[dateKey] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Action Buttons - Mobile First */}
          <div className="grid grid-cols-2 gap-3 mb-6 md:flex md:justify-end">
            <Link
              href={`/trips/${trip.id}/add-expense`}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-blue-pink text-white rounded-2xl hover:shadow-xl transition-all font-bold text-lg md:text-base transform active:scale-95"
            >
              <span className="text-2xl md:text-xl">💰</span>
              <span>{t.addExpense}</span>
            </Link>
            <Link
              href={`/trips/${trip.id}/add-activity`}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-sunset-pink text-white rounded-2xl hover:shadow-xl transition-all font-bold text-lg md:text-base transform active:scale-95"
            >
              <span className="text-2xl md:text-xl">📅</span>
              <span>{t.addActivity}</span>
            </Link>
          </div>

          {/* Trip Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{trip.name || trip.destination}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-gray-600">
                  <span className="flex items-center gap-2">
                    <span className="text-xl">📍</span>
                    <span className="text-base md:text-lg">{trip.destination}</span>
                  </span>
                  <span className="hidden sm:inline text-gray-400">•</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xl">📅</span>
                    <span className="text-sm md:text-base">
                      {format(new Date(trip.startDate), "MMM d")} - {format(new Date(trip.endDate), "MMM d, yyyy")}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm">
                  📤 {t.share}
                </button>
                <button className="flex-1 md:flex-none px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all font-medium text-sm">
                  ⚙️ {t.settings}
                </button>
              </div>
            </div>

            {/* Budget Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 p-5 md:p-6 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm font-medium text-indigo-900">{t.totalBudget}</p>
                  <span className="text-xl md:text-2xl">💰</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-indigo-600">
                  ${trip.totalBudget.toLocaleString()}
                </p>
              </div>
              <div
                className={`p-5 md:p-6 rounded-xl border ${
                  percentUsed > 100
                    ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
                    : "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm font-medium text-gray-900">{t.totalSpent}</p>
                  <span className="text-xl md:text-2xl">{percentUsed > 100 ? "⚠️" : "✅"}</span>
                </div>
                <p
                  className={`text-2xl md:text-3xl font-bold ${
                    percentUsed > 100 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  ${totalSpent.toLocaleString()}
                </p>
              </div>
              <div
                className={`p-5 md:p-6 rounded-xl border ${
                  remaining < 0
                    ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
                    : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm font-medium text-gray-900">{t.remaining}</p>
                  <span className="text-xl md:text-2xl">{remaining < 0 ? "🚨" : "💵"}</span>
                </div>
                <p
                  className={`text-2xl md:text-3xl font-bold ${
                    remaining < 0 ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  ${Math.abs(remaining).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all ${
                    percentUsed > 100
                      ? "bg-gradient-to-r from-red-500 to-red-600"
                      : percentUsed > 75
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                      : "bg-gradient-to-r from-green-500 to-green-600"
                  }`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm font-medium text-gray-700">
                  {percentUsed.toFixed(1)}% {t.percentOfBudget}
                </p>
                {percentUsed > 90 && (
                  <p className="text-sm font-medium text-orange-600">
                    ⚠️ {percentUsed > 100 ? `${t.over} ${t.budget}!` : t.nearLimit}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs for Budget and Itinerary */}
          <TripTabs
            budgetTab={
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Category Budget Breakdown */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <span>📊</span>
                      <span>{t.budgetByCategory}</span>
                    </h2>
                    <div className="space-y-5">
                      {categorySpending.map((cat) => (
                        <div key={cat.category} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-gray-900 text-lg">{translateCategory(cat.category, locale)}</span>
                            <div className="text-right">
                              <div className="font-bold text-gray-900">
                                ${cat.spent.toLocaleString()} <span className="text-gray-400">/</span> ${cat.budget.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {cat.percentUsed.toFixed(1)}% {t.used}
                              </div>
                            </div>
                          </div>
                          <div className="relative bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-3 rounded-full transition-all ${
                                cat.percentUsed > 100
                                  ? "bg-gradient-to-r from-red-500 to-red-600"
                                  : cat.percentUsed > 80
                                  ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                  : "bg-gradient-to-r from-blue-500 to-indigo-600"
                              }`}
                              style={{ width: `${Math.min(cat.percentUsed, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-sm mt-2">
                            <span
                              className={`font-medium ${
                                cat.remaining < 0 ? "text-red-600" : "text-green-600"
                              }`}
                            >
                              {cat.remaining < 0 ? "⚠️" : "✓"} ${Math.abs(cat.remaining).toLocaleString()} {cat.remaining < 0 ? t.over : t.remaining}
                            </span>
                            {cat.percentUsed > 90 && (
                              <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                                {t.nearLimit}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Budget Chart */}
                  <BudgetChart
                    categorySpending={categorySpending}
                    tripId={trip.id}
                    destination={trip.destination}
                    budgetImageUrl={trip.budgetImageUrl}
                  />
                </div>

              {/* AI Expense Insights */}
              <div className="mb-6">
                <ExpenseInsights tripId={trip.id} />
              </div>

              {/* Expense List - View Only */}
              <ExpenseList expenses={trip.expenses} currentUserEmail={session.user.email || undefined} />
            </>
          }
          itineraryTab={
            <ItineraryView
              tripId={trip.id}
              destination={trip.destination}
              initialActivities={trip.activities}
              startDate={trip.startDate}
              endDate={trip.endDate}
              itineraryImageUrl={trip.itineraryImageUrl}
            />
          }
          />
        </div>
      </div>
  );
}
