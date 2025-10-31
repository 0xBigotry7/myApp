import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import { getHouseholdUserIds, getUserBadge } from "@/lib/household";

export default async function TransactionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get all household user IDs for shared financial view
  const householdUserIds = await getHouseholdUserIds();

  // Get all users for color coding
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true },
  });

  // Fetch all household transactions with account details
  const transactions = await prisma.transaction.findMany({
    where: { userId: { in: householdUserIds } },
    include: {
      account: {
        select: {
          id: true,
          name: true,
          type: true,
          icon: true,
          color: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { date: "desc" },
    take: 100, // Limit to recent 100 transactions
  });

  // Group transactions by date
  const groupedTransactions: { [key: string]: typeof transactions } = {};
  transactions.forEach((t) => {
    const dateKey = new Date(t.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groupedTransactions[dateKey]) {
      groupedTransactions[dateKey] = [];
    }
    groupedTransactions[dateKey].push(t);
  });

  // Calculate summary
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Transactions
          </h1>
          <p className="text-gray-600 mt-1">
            Shared household income and expenses
          </p>
          <div className="flex gap-2 mt-2">
            {allUsers.map((user) => {
              const badge = getUserBadge(user.id, allUsers);
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: badge.color }}
                >
                  <span className="font-bold">{badge.initial}</span>
                  <span>{badge.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalIncome.toFixed(2)}
                </p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  ${totalExpenses.toFixed(2)}
                </p>
              </div>
              <div className="text-4xl">📉</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Cash Flow</p>
                <p
                  className={`text-2xl font-bold ${
                    totalIncome - totalExpenses >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ${(totalIncome - totalExpenses).toFixed(2)}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6">Recent Transactions</h2>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-600 mb-2">No transactions yet</p>
              <p className="text-sm text-gray-500">
                Click the + button to add your first transaction
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedTransactions).map(([date, txns]) => (
                <div key={date}>
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">
                    {date}
                  </h3>
                  <div className="space-y-2">
                    {txns.map((transaction) => {
                      const userBadge = getUserBadge(transaction.userId, allUsers);
                      return (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border-l-4"
                          style={{ borderLeftColor: userBadge.color }}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {/* Category Icon */}
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                              style={{
                                backgroundColor: transaction.account.color || "#e5e7eb",
                              }}
                            >
                              {transaction.account.icon || "💳"}
                            </div>

                            {/* Transaction Details */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">
                                  {transaction.merchantName || transaction.category}
                                </p>
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                  {transaction.category}
                                </span>
                                {transaction.isTripRelated && (
                                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                    ✈️ Trip
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span
                                  className="font-semibold px-1.5 py-0.5 rounded text-white text-xs"
                                  style={{ backgroundColor: userBadge.color }}
                                >
                                  {userBadge.initial}
                                </span>
                                <span>{userBadge.name}</span>
                                <span>•</span>
                                <span>{transaction.account.name}</span>
                                {transaction.description && (
                                  <>
                                    <span>•</span>
                                    <span>{transaction.description}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${
                                transaction.amount >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.amount >= 0 ? "+" : "-"}$
                              {Math.abs(transaction.amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Add FAB */}
      <QuickAddTransaction />
      </div>
    </>
  );
}
