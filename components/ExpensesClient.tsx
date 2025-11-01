"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";
import { format } from "date-fns";
import Link from "next/link";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  icon?: string;
  color?: string;
}

interface Transaction {
  id: string;
  amount: number;
  category: string;
  merchantName?: string;
  description?: string;
  date: string;
  account: Account;
  receiptUrl?: string;
  isRecurring: boolean;
}

interface BudgetEnvelope {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  rollover: number;
  icon?: string;
  color?: string;
}

interface Budget {
  id: string;
  month: number;
  year: number;
  totalIncome: number;
  totalAllocated: number;
  envelopes: BudgetEnvelope[];
}

interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: string;
  nextDate: string;
  merchantName?: string;
}

interface ExpensesClientProps {
  budget: Budget | null;
  accounts: Account[];
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  currentMonth: number;
  currentYear: number;
}

const EXPENSE_CATEGORIES = [
  { name: "Groceries", icon: "🛒", color: "#10b981" },
  { name: "Dining", icon: "🍽️", color: "#f59e0b" },
  { name: "Transportation", icon: "🚗", color: "#3b82f6" },
  { name: "Utilities", icon: "💡", color: "#8b5cf6" },
  { name: "Rent/Mortgage", icon: "🏠", color: "#ef4444" },
  { name: "Entertainment", icon: "🎬", color: "#ec4899" },
  { name: "Shopping", icon: "🛍️", color: "#14b8a6" },
  { name: "Healthcare", icon: "⚕️", color: "#06b6d4" },
  { name: "Subscriptions", icon: "📱", color: "#6366f1" },
  { name: "Other", icon: "📦", color: "#64748b" },
];

export default function ExpensesClient({
  budget,
  accounts,
  transactions,
  recurringTransactions,
  currentMonth,
  currentYear,
}: ExpensesClientProps) {
  const locale = useLocale();
  const t = getTranslations(locale);
  const router = useRouter();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Calculate total spent this month
  const totalSpent = useMemo(() => {
    return transactions.reduce((sum, t) => {
      const txDate = new Date(t.date);
      if (txDate.getMonth() + 1 === currentMonth && txDate.getFullYear() === currentYear) {
        return sum + Math.abs(t.amount);
      }
      return sum;
    }, 0);
  }, [transactions, currentMonth, currentYear]);

  // Calculate remaining budget
  const totalBudget = budget?.totalAllocated || 0;
  const remaining = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Calculate spending by category
  const categorySpending = useMemo(() => {
    const spending: Record<string, number> = {};
    transactions.forEach(t => {
      const txDate = new Date(t.date);
      if (txDate.getMonth() + 1 === currentMonth && txDate.getFullYear() === currentYear) {
        spending[t.category] = (spending[t.category] || 0) + Math.abs(t.amount);
      }
    });
    return spending;
  }, [transactions, currentMonth, currentYear]);

  // Get month name
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const currentMonthName = monthNames[currentMonth - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💰 Expenses</h1>
          <p className="text-gray-600 mt-1">{currentMonthName} {currentYear}</p>
        </div>
        <Link
          href="/expenses/add"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
        >
          <span className="text-xl">+</span>
          <span>Add Expense</span>
        </Link>
      </div>

      {/* Budget Overview Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-indigo-100 text-sm font-medium">Monthly Budget</p>
            <p className="text-4xl font-bold mt-1">${totalBudget.toLocaleString()}</p>
          </div>
          <Link
            href="/expenses/budget"
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-all"
          >
            Edit Budget
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-indigo-100 text-xs">Spent</p>
            <p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-indigo-100 text-xs">Remaining</p>
            <p className={`text-2xl font-bold ${remaining < 0 ? "text-red-200" : ""}`}>
              ${Math.abs(remaining).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all ${
                percentUsed > 100
                  ? "bg-red-400"
                  : percentUsed > 80
                  ? "bg-yellow-300"
                  : "bg-green-400"
              }`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>
          <p className="text-sm text-indigo-100 mt-2">
            {percentUsed.toFixed(1)}% of budget used
            {percentUsed > 90 && " ⚠️"}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      {budget && budget.envelopes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 By Category</h2>
          <div className="space-y-3">
            {budget.envelopes.map((envelope) => {
              const spent = categorySpending[envelope.category] || 0;
              const allocated = envelope.allocated + envelope.rollover;
              const percentUsed = allocated > 0 ? (spent / allocated) * 100 : 0;
              const categoryInfo = EXPENSE_CATEGORIES.find(c => c.name === envelope.category);

              return (
                <div key={envelope.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                      <span className="text-lg sm:text-xl flex-shrink-0">{categoryInfo?.icon || "📦"}</span>
                      <span className="font-semibold text-sm sm:text-base text-gray-900 truncate">{envelope.category}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm sm:text-base text-gray-900 whitespace-nowrap">
                        ${spent.toFixed(0)} <span className="text-gray-400">/</span> ${allocated.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  <div className="relative bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        percentUsed > 100
                          ? "bg-red-500"
                          : percentUsed > 80
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(percentUsed, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {percentUsed.toFixed(0)}% used
                    {envelope.rollover > 0 && (
                      <span className="ml-2 text-green-600">
                        (+${envelope.rollover.toFixed(0)} rollover)
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">📝 Recent Transactions</h2>
          <Link
            href="/expenses/all"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No transactions yet</p>
            <Link
              href="/expenses/add"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold"
            >
              <span className="text-xl">+</span>
              <span>Add Your First Expense</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 10).map((transaction) => {
              const categoryInfo = EXPENSE_CATEGORIES.find(c => c.name === transaction.category);
              return (
                <div
                  key={transaction.id}
                  className="flex justify-between items-start p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-2">
                    <span className="text-xl sm:text-2xl flex-shrink-0">{categoryInfo?.icon || "📦"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                        {transaction.merchantName || transaction.category}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                        <span className="whitespace-nowrap">{format(new Date(transaction.date), "MMM d, yyyy")}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate">{transaction.account.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm sm:text-base text-gray-900 whitespace-nowrap">
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    {transaction.isRecurring && (
                      <p className="text-xs text-purple-600">↻ Recurring</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Bills */}
      {recurringTransactions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Upcoming Bills</h2>
          <div className="space-y-2">
            {recurringTransactions.slice(0, 5).map((recurring) => {
              const categoryInfo = EXPENSE_CATEGORIES.find(c => c.name === recurring.category);
              const daysUntil = Math.ceil(
                (new Date(recurring.nextDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={recurring.id}
                  className="flex justify-between items-start p-3 bg-purple-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-2">
                    <span className="text-xl sm:text-2xl flex-shrink-0">{categoryInfo?.icon || "📦"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">{recurring.name}</p>
                      <p className="text-xs text-gray-600">
                        {daysUntil === 0
                          ? "Due today"
                          : daysUntil === 1
                          ? "Due tomorrow"
                          : `Due in ${daysUntil} days`}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-sm sm:text-base text-gray-900 whitespace-nowrap flex-shrink-0">${recurring.amount.toFixed(2)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accounts Summary */}
      {accounts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">💳 Accounts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base text-gray-900 flex items-center gap-2 truncate">
                      {account.icon && <span className="flex-shrink-0">{account.icon}</span>}
                      <span className="truncate">{account.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 capitalize mt-1">{account.type.replace("_", " ")}</p>
                  </div>
                  <p className="font-bold text-base sm:text-lg text-gray-900 whitespace-nowrap flex-shrink-0">
                    ${account.balance.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
