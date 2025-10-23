"use client";

import { format } from "date-fns";
import { useLocale } from "@/components/LanguageSwitcher";
import { getTranslations, translateCategory } from "@/lib/i18n";

interface Expense {
  id: string;
  amount: number;
  category: string;
  currency: string;
  date: Date;
  note: string | null;
  user: {
    name: string;
    email: string;
  };
}

interface ExpenseListProps {
  expenses: Expense[];
  currentUserEmail?: string;
}

export default function ExpenseList({ expenses, currentUserEmail }: ExpenseListProps) {
  const locale = useLocale();
  const t = getTranslations(locale);

  // Helper function to get user color
  const getUserColor = (userEmail: string) => {
    if (!currentUserEmail) {
      // If no current user, alternate between colors based on unique users
      const uniqueUsers = Array.from(new Set(expenses.map(e => e.user.email)));
      const userIndex = uniqueUsers.indexOf(userEmail);
      return userIndex % 2 === 0
        ? { bg: "bg-blue-50/60 hover:bg-blue-50/80 border border-blue-100/50", badge: "bg-blue-100/70 text-blue-700" }
        : { bg: "bg-pink-50/60 hover:bg-pink-50/80 border border-pink-100/50", badge: "bg-pink-100/70 text-pink-700" };
    }

    // Current user gets light blue, others get light pink
    return userEmail === currentUserEmail
      ? { bg: "bg-blue-50/60 hover:bg-blue-50/80 border border-blue-100/50", badge: "bg-blue-100/70 text-blue-700", icon: "👤" }
      : { bg: "bg-pink-50/60 hover:bg-pink-50/80 border border-pink-100/50", badge: "bg-pink-100/70 text-pink-700", icon: "💝" };
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">{t.recentExpenses}</h3>
        <p className="text-gray-500 text-center py-8">{t.noExpensesYet}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">{t.recentExpenses}</h3>
      <div className="space-y-3">
        {expenses.map((expense) => {
          const colors = getUserColor(expense.user.email);
          return (
            <div
              key={expense.id}
              className={`flex justify-between items-center p-4 rounded-xl transition-all ${colors.bg}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-lg">
                    ${expense.amount.toFixed(2)}
                  </span>
                  <span className={`text-sm px-3 py-1 rounded-lg font-medium ${colors.badge}`}>
                    {translateCategory(expense.category, locale)}
                  </span>
                </div>
                {expense.note && (
                  <p className="text-sm text-gray-600 mt-1">{expense.note}</p>
                )}
                <div className="flex gap-4 text-xs text-gray-500 mt-1">
                  <span>{format(new Date(expense.date), "MMM d, yyyy")}</span>
                  <span className="flex items-center gap-1">
                    {colors.icon && <span>{colors.icon}</span>}
                    <span>{t.addedBy} {expense.user.name}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
