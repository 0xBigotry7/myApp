import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import QuickAddTransaction from "@/components/QuickAddTransaction";

export default async function FinancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get financial data
  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const allTransactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    include: {
      account: { select: { name: true, icon: true, color: true } },
    },
    orderBy: { date: "desc" },
  });

  // Calculate financial metrics
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const thisMonthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  const thisMonthTransactions = allTransactions.filter(
    (t) => new Date(t.date) >= thisMonthStart
  );

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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              💰 Finance Dashboard
            </h1>
            <p className="text-gray-600">
              Your complete financial overview and budget tracking
            </p>
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
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">This Month Income</p>
                <span className="text-2xl">📈</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                ${thisMonthIncome.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {thisMonthTransactions.filter((t) => t.amount > 0).length}{" "}
                transactions
              </p>
            </div>

            {/* This Month Expenses */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">This Month Expenses</p>
                <span className="text-2xl">📉</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                ${thisMonthExpenses.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {thisMonthTransactions.filter((t) => t.amount < 0).length}{" "}
                transactions
              </p>
            </div>

            {/* Net Cash Flow */}
            <div
              className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${
                thisMonthIncome - thisMonthExpenses >= 0
                  ? "border-green-500"
                  : "border-red-500"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Net Cash Flow</p>
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
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span>📊</span> Spending Breakdown
                </h2>

                {/* Trip vs Regular Expenses */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Regular Expenses
                    </span>
                    <span className="text-sm font-bold">
                      ${regularExpenses.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
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
                    <span className="text-sm font-medium text-gray-700">
                      ✈️ Travel Expenses
                    </span>
                    <span className="text-sm font-bold">
                      ${tripExpenses.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{
                        width: `${(tripExpenses / thisMonthExpenses) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Top Categories */}
                <h3 className="text-sm font-semibold text-gray-700 mb-3 mt-6">
                  Top Spending Categories
                </h3>
                <div className="space-y-3">
                  {topCategories.map(([category, amount]) => (
                    <div key={category}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-700">{category}</span>
                        <span className="text-sm font-semibold">
                          ${amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span>📝</span> Recent Transactions
                  </h2>
                  <Link
                    href="/transactions"
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    View All →
                  </Link>
                </div>

                <div className="space-y-3">
                  {recentTransactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No transactions yet</p>
                      <p className="text-sm mt-1">
                        Click the + button to add your first transaction
                      </p>
                    </div>
                  ) : (
                    recentTransactions.map((txn) => (
                      <div
                        key={txn.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
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
                            <p className="font-medium text-gray-900">
                              {txn.merchantName || txn.category}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
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
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - 1/3 width */}
            <div className="space-y-8">
              {/* Accounts List */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span>🏦</span> Accounts
                  </h2>
                  <Link
                    href="/accounts"
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    Manage →
                  </Link>
                </div>

                {accounts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🏦</div>
                    <p className="text-sm text-gray-600 mb-3">No accounts yet</p>
                    <Link
                      href="/accounts"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Create your first account
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="p-3 rounded-lg border hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: acc.color || "#e5e7eb" }}
                          >
                            <span className="text-lg">{acc.icon || "💳"}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {acc.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {acc.type.replace("_", " ")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            ${acc.balance.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">{acc.currency}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border border-purple-100">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link
                    href="/transactions"
                    className="block w-full p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-center font-medium"
                  >
                    📊 View All Transactions
                  </Link>
                  <Link
                    href="/accounts"
                    className="block w-full p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-center font-medium"
                  >
                    🏦 Manage Accounts
                  </Link>
                  <Link
                    href="/"
                    className="block w-full p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-center font-medium"
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
