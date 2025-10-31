import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default async function AccountsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });

  const totalBalance = accounts
    .filter((acc) => acc.isActive)
    .reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Accounts
          </h1>
          <p className="text-gray-600 mt-1">Manage your financial accounts</p>
        </div>

        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-xl p-8 text-white mb-8">
          <p className="text-sm opacity-90 mb-2">Total Balance</p>
          <p className="text-5xl font-bold mb-4">${totalBalance.toFixed(2)}</p>
          <p className="text-sm opacity-75">
            Across {accounts.filter((a) => a.isActive).length} active accounts
          </p>
        </div>

        {/* Accounts Grid */}
        {accounts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🏦</div>
            <h3 className="text-xl font-bold mb-2">No accounts yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first account to start tracking your finances
            </p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              + Create Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <div
                key={account.id}
                className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow ${
                  !account.isActive ? "opacity-60" : ""
                }`}
              >
                {/* Account Header */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{
                      backgroundColor: account.color || "#e5e7eb",
                    }}
                  >
                    {account.icon || "💳"}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      {account.type.replace("_", " ")}
                    </div>
                    {!account.isActive && (
                      <div className="text-xs text-red-600 font-medium">
                        Inactive
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Name */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {account.name}
                </h3>

                {/* Balance */}
                <div className="mb-4">
                  <p className="text-3xl font-bold text-gray-900">
                    ${account.balance.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">{account.currency}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    {account._count.transactions} transactions
                  </div>
                  <Link
                    href={`/transactions?accountId=${account.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View →
                  </Link>
                </div>

                {/* Notes */}
                {account.notes && (
                  <p className="text-xs text-gray-500 mt-3 pt-3 border-t">
                    {account.notes}
                  </p>
                )}
              </div>
            ))}

            {/* Add New Account Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg p-6 flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
              <div className="text-center">
                <div className="text-5xl mb-3">+</div>
                <p className="text-gray-600 font-medium">Add New Account</p>
              </div>
            </div>
          </div>
        )}

        {/* Account Types Info */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">Account Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏦</span>
              <div>
                <p className="font-semibold">Checking</p>
                <p className="text-sm text-gray-600">
                  Your primary spending account
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="font-semibold">Savings</p>
                <p className="text-sm text-gray-600">
                  Long-term savings and emergency funds
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💳</span>
              <div>
                <p className="font-semibold">Credit Card</p>
                <p className="text-sm text-gray-600">
                  Track credit card balances and payments
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💵</span>
              <div>
                <p className="font-semibold">Cash</p>
                <p className="text-sm text-gray-600">
                  Physical cash on hand
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <p className="font-semibold">Investment</p>
                <p className="text-sm text-gray-600">
                  Stocks, bonds, and investment accounts
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
