import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import ExpenseList from "@/components/ExpenseList";
import BudgetChart from "@/components/BudgetChart";
import ExpenseInsights from "@/components/ExpenseInsights";
import TripPageTabs from "@/components/TripPageTabs";
import DatabaseErrorPage from "@/components/DatabaseErrorPage";
import { getTranslations, translateCategory } from "@/lib/i18n";
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

  const totalSpent = trip.expenses.reduce((sum, exp) => sum + convertToUSD(exp.amount, exp.currency), 0);
  const remaining = trip.totalBudget - totalSpent;
  const percentUsed = (totalSpent / trip.totalBudget) * 100;

  // Calculate spending by category
  const categorySpending = trip.budgetCategories.map((bc) => {
    const spent = trip.expenses
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

  // Daily spending for trend
  const expensesByDate = trip.expenses.reduce((acc, exp) => {
    const dateKey = format(new Date(exp.date), "yyyy-MM-dd");
    acc[dateKey] = (acc[dateKey] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Trip Header - Minimal */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
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

          {/* Tabbed Content */}
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
  );
}
