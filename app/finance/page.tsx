import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import { getHouseholdUserIds, getUserBadge } from "@/lib/household";
import { convertCurrency } from "@/lib/currency";

// Revalidate every 30 seconds for fresher data
export const revalidate = 30;

export default async function FinancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get all household user IDs for shared financial view
  const householdUserIds = await getHouseholdUserIds();

  // Run all database queries in parallel for better performance
  const thisMonthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  const [allUsers, accounts, allTransactions] = await Promise.all([
    // Get all users for color coding
    prisma.user.findMany({
      select: { id: true, name: true },
    }),

    // Get financial data for entire household
    prisma.account.findMany({
      where: { userId: { in: householdUserIds }, isActive: true },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true } },
      },
    }),

    // Get recent transactions only (for better performance)
    prisma.transaction.findMany({
      where: { 
        userId: { in: householdUserIds },
        date: { gte: thisMonthStart } // Only get this month's transactions
      },
      include: {
        account: { select: { name: true, icon: true, color: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
      take: 200, // Limit for performance
    }),
  ]);

  // Calculate financial metrics - convert all accounts to USD for accurate total balance
  const totalBalance = accounts.reduce((sum, acc) => {
    const amountInUSD = convertCurrency(acc.balance, acc.currency, "USD");
    return sum + amountInUSD;
  }, 0);

  // All transactions are already filtered to this month
  const thisMonthTransactions = allTransactions;

  const thisMonthIncome = thisMonthTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const thisMonthExpenses = Math.abs(
    thisMonthTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const tripExpenses = thisMonthTransactions
    .filter((t) => t.isTripRelated && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const regularExpenses = thisMonthExpenses - tripExpenses;

  // Category breakdown
  const categoryTotals: { [key: string]: number } = {};
  thisMonthTransactions
    .filter((t) => t.amount < 0)
    .forEach((t) => {
      const category = t.category || "Uncategorized";
      categoryTotals[category] =
        (categoryTotals[category] || 0) + Math.abs(t.amount);
    });

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Recent transactions
  const recentTransactions = allTransactions.slice(0, 10);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              💰 Finance Dashboard
            </h1>
            <p className="text-gray-600 dark:text-zinc-400">
              Shared household financial overview and budget tracking
            </p>
            <div className="flex gap-2 mt-3">
              {allUsers.map((user) => {
                const badge = getUserBadge(user.id, allUsers);
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: badge.color }}
                  >
                    <span className="font-bold">{badge.initial}</span>
                    <span>{badge.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Balance */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm opacity-90">Total Balance</p>
                <span className="text-2xl">💎</span>
              </div>
              <p className="text-3xl font-bold mb-1">
                ${totalBalance.toFixed(2)}
              </p>
              <p className="text-xs opacity-75">{accounts.length} accounts</p>
            </div>

            {/* This Month Income */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-zinc-400">This Month Income</p>
                <span className="text-2xl">📈</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${thisMonthIncome.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-500">
                {thisMonthTransactions.filter((t) => t.amount > 0).length}{" "}
                transactions
              </p>
            </div>

            {/* This Month Expenses */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-zinc-400">This Month Expenses</p>
                <span className="text-2xl">📉</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${thisMonthExpenses.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-500">
                {thisMonthTransactions.filter((t) => t.amount < 0).length}{" "}
                transactions
              </p>
            </div>

            {/* Net Cash Flow */}
            <div
              className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 border-l-4 ${
                thisMonthIncome - thisMonthExpenses >= 0
                  ? "border-green-500"
                  : "border-red-500"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-zinc-400">Net Cash Flow</p>
                <span className="text-2xl">
                  {thisMonthIncome - thisMonthExpenses >= 0 ? "✅" : "⚠️"}
                </span>
              </div>
              <p
                className={`text-3xl font-bold ${
                  thisMonthIncome - thisMonthExpenses >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {thisMonthIncome - thisMonthExpenses >= 0 ? "+" : "-"}$
                {Math.abs(thisMonthIncome - thisMonthExpenses).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {((thisMonthExpenses / thisMonthIncome) * 100).toFixed(0)}% of
                income
              </p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-8">
              {/* Spending Breakdown */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                  <span>📊</span> Spending Breakdown
                </h2>

                {/* Trip vs Regular Expenses */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                      Regular Expenses
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      ${regularExpenses.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${
                          (regularExpenses / thisMonthExpenses) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                      ✈️ Travel Expenses
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      ${tripExpenses.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{
                        width: `${(tripExpenses / thisMonthExpenses) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Top Categories */}
                <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3 mt-6">
                  Top Spending Categories
                </h3>
                <div className="space-y-3">
                  {topCategories.map(([category, amount]) => (
                    <div key={category}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-700 dark:text-zinc-300">{category}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          ${amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-blue-500"
                          style={{
                            width: `${(amount / thisMonthExpenses) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <span>📝</span> Recent Transactions
                  </h2>
                  <Link
                    href="/transactions"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    View All →
                  </Link>
                </div>

                <div className="space-y-3">
                  {recentTransactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-zinc-400">
                      <p>No transactions yet</p>
                      <p className="text-sm mt-1">
                        Click the + button to add your first transaction
                      </p>
                    </div>
                  ) : (
                    recentTransactions.map((txn) => {
                      const userBadge = getUserBadge(txn.userId, allUsers);
                      return (
                        <div
                          key={txn.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors border-l-4"
                          style={{ borderLeftColor: userBadge.color }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{
                                backgroundColor: txn.account.color || "#e5e7eb",
                              }}
                            >
                              <span className="text-lg">
                                {txn.account.icon || "💳"}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {txn.merchantName || txn.category}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                                <span
                                  className="font-semibold px-1.5 py-0.5 rounded text-white"
                                  style={{ backgroundColor: userBadge.color }}
                                >
                                  {userBadge.initial}
                                </span>
                                <span>{txn.account.name}</span>
                                <span>•</span>
                                <span>
                                  {new Date(txn.date).toLocaleDateString()}
                                </span>
                                {txn.isTripRelated && (
                                  <>
                                    <span>•</span>
                                    <span className="text-purple-600">✈️ Trip</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-lg font-bold ${
                              txn.amount >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {txn.amount >= 0 ? "+" : "-"}$
                            {Math.abs(txn.amount).toFixed(2)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - 1/3 width */}
            <div className="space-y-8">
              {/* Accounts List */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <span>🏦</span> Accounts
                  </h2>
                  <Link
                    href="/accounts"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Manage →
                  </Link>
                </div>

                {accounts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🏦</div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 mb-3">No accounts yet</p>
                    <Link
                      href="/accounts"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Create your first account
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accounts.map((acc) => {
                      const userBadge = getUserBadge(acc.userId, allUsers);
                      return (
                        <div
                          key={acc.id}
                          className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: acc.color || "#e5e7eb" }}
                            >
                              <span className="text-lg">{acc.icon || "💳"}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {acc.name}
                                </p>
                                <span
                                  className="text-xs font-bold px-1.5 py-0.5 rounded text-white"
                                  style={{ backgroundColor: userBadge.color }}
                                >
                                  {userBadge.initial}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-zinc-400">
                                {acc.type.replace("_", " ")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                              ${acc.balance.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">{acc.currency}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl shadow-lg p-6 border border-purple-100 dark:border-purple-900/30">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
                <div className="space-y-3">
                  <Link
                    href="/transactions"
                    className="block w-full p-3 bg-white dark:bg-zinc-800 rounded-lg shadow hover:shadow-md transition-shadow text-center font-medium text-gray-900 dark:text-white"
                  >
                    📊 View All Transactions
                  </Link>
                  <Link
                    href="/accounts"
                    className="block w-full p-3 bg-white dark:bg-zinc-800 rounded-lg shadow hover:shadow-md transition-shadow text-center font-medium text-gray-900 dark:text-white"
                  >
                    🏦 Manage Accounts
                  </Link>
                  <Link
                    href="/"
                    className="block w-full p-3 bg-white dark:bg-zinc-800 rounded-lg shadow hover:shadow-md transition-shadow text-center font-medium text-gray-900 dark:text-white"
                  >
                    ✈️ View Trips
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <QuickAddTransaction />
    </>
  );
}
