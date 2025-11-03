"use client";

import { format } from "date-fns";
import { useLocale } from "@/components/LanguageSwitcher";
import { getTranslations, translateCategory } from "@/lib/i18n";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AccommodationExpenseCardCompact from "./AccommodationExpenseCardCompact";

interface Expense {
  id: string;
  amount: number;
  category: string;
  currency: string;
  date: Date;
  note: string | null;
  // Accommodation fields
  accommodationName?: string | null;
  accommodationType?: string | null;
  checkInDate?: Date | null;
  checkOutDate?: Date | null;
  numberOfNights?: number | null;
  googlePlaceId?: string | null;
  hotelAddress?: string | null;
  hotelPhone?: string | null;
  hotelWebsite?: string | null;
  hotelRating?: number | null;
  hotelPhotos?: string[];
  latitude?: number | null;
  longitude?: number | null;
  confirmationNumber?: string | null;
  user: {
    name: string;
    email: string;
  };
}

interface ExpenseListProps {
  expenses: Expense[];
  currentUserEmail?: string;
  tripId: string;
}

export default function ExpenseList({ expenses, currentUserEmail, tripId }: ExpenseListProps) {
  const locale = useLocale();
  const t = getTranslations(locale);
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    setDeletingId(expenseId);
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to delete expense");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Error deleting expense");
    } finally {
      setDeletingId(null);
    }
  };

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

  // Check if expense is an accommodation
  const isAccommodation = (expense: Expense) => {
    return expense.category === "Accommodation" || expense.accommodationName != null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">{t.recentExpenses}</h3>
      <div className="space-y-3">
        {expenses.map((expense) => {
          const colors = getUserColor(expense.user.email);

          // Render accommodation expenses with compact card
          if (isAccommodation(expense)) {
            return (
              <AccommodationExpenseCardCompact
                key={expense.id}
                expense={expense}
                userColor={colors}
                onEdit={() => router.push(`/trips/${tripId}/edit-accommodation/${expense.id}`)}
                onDelete={() => handleDelete(expense.id)}
              />
            );
          }

          // Render regular expenses
          return (
            <div
              key={expense.id}
              className={`flex justify-between items-start p-4 rounded-xl transition-all ${colors.bg} group`}
            >
              <div className="flex-1 min-w-0 mr-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-base sm:text-lg whitespace-nowrap">
                    ${expense.amount.toFixed(2)}
                  </span>
                  <span className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg font-medium ${colors.badge} truncate`}>
                    {translateCategory(expense.category, locale)}
                  </span>
                </div>
                {expense.note && (
                  <p className="text-sm text-gray-600 mt-1 break-words line-clamp-2">{expense.note}</p>
                )}
                <div className="flex gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                  <span className="whitespace-nowrap">{format(new Date(expense.date), "MMM d, yyyy")}</span>
                  <span className="flex items-center gap-1">
                    {colors.icon && <span>{colors.icon}</span>}
                    <span className="truncate">{t.addedBy} {expense.user.name}</span>
                  </span>
                </div>
              </div>
              <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                <button
                  onClick={() => router.push(`/trips/${tripId}/edit-expense/${expense.id}`)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all touch-manipulation md:opacity-0 md:group-hover:opacity-100"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(expense.id)}
                  disabled={deletingId === expense.id}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all disabled:opacity-50 touch-manipulation md:opacity-0 md:group-hover:opacity-100"
                  title="Delete"
                >
                  {deletingId === expense.id ? "⏳" : "🗑️"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
