"use client";

import { format } from "date-fns";
import { useLocale } from "@/components/LanguageSwitcher";
import { getTranslations, translateCategory } from "@/lib/i18n";
import { useState, useCallback, memo, useMemo } from "react";
import { useRouter } from "next/navigation";
import AccommodationExpenseCardCompact from "./AccommodationExpenseCardCompact";
import EditExpenseModal from "./EditExpenseModal";
import { 
  Edit2, 
  Trash2, 
  Receipt, 
  MapPin, 
  Calendar, 
  User,
} from "lucide-react";

interface Expense {
  id: string;
  amount: number;
  category: string;
  currency: string;
  date: Date;
  note: string | null;
  location: string | null;
  receiptUrl: string | null;
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
  categories: string[];
  defaultLocation?: string;
}

function ExpenseList({ expenses, currentUserEmail, tripId, categories, defaultLocation }: ExpenseListProps) {
  const locale = useLocale();
  const t = getTranslations(locale);
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Memoize currency symbols map
  const getCurrencySymbol = useCallback((currency: string) => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CNY: "¥",
      THB: "฿",
    };
    return symbols[currency] || "$";
  }, []);

  const handleDelete = useCallback(async (expenseId: string) => {
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
  }, [router]);
  
  const handleCloseModal = useCallback(() => setEditingExpense(null), []);

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-[24px] border border-zinc-100 p-12 text-center">
        <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Receipt className="w-8 h-8 text-zinc-300" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900 mb-2">{t.recentExpenses}</h3>
        <p className="text-zinc-500 font-medium">{t.noExpensesYet}</p>
      </div>
    );
  }

  const isAccommodation = (expense: Expense) => {
    return expense.category === "Accommodation" || expense.accommodationName != null;
  };

  return (
    <div className="bg-white rounded-[24px] border border-zinc-100 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-zinc-100 flex items-center gap-3">
        <div className="p-2 bg-zinc-100 rounded-xl text-zinc-500">
          <Receipt className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900">{t.recentExpenses}</h3>
      </div>
      
      <div className="divide-y divide-zinc-50">
        {expenses.map((expense) => {
          if (isAccommodation(expense)) {
            return (
              <div key={expense.id} className="p-4 sm:p-6 hover:bg-zinc-50/50 transition-colors">
                <AccommodationExpenseCardCompact
                  expense={expense}
                  userColor={{ bg: "bg-zinc-50", badge: "bg-zinc-200 text-zinc-800" }}
                  onEdit={() => router.push(`/trips/${tripId}/edit-accommodation/${expense.id}`)}
                  onDelete={() => handleDelete(expense.id)}
                />
              </div>
            );
          }

          return (
            <div
              key={expense.id}
              className="group relative flex items-start p-4 sm:p-6 hover:bg-zinc-50/80 transition-all"
            >
              {/* Category Icon */}
              <div className="mr-5 mt-1 hidden sm:block">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100 shadow-sm group-hover:scale-105 transition-transform">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>

              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center flex-wrap gap-3 mb-1.5">
                  <span className="font-black text-lg text-zinc-900 tracking-tight">
                    {getCurrencySymbol(expense.currency)}{expense.amount.toFixed(2)}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-xs font-bold text-zinc-600 uppercase tracking-wide">
                    {translateCategory(expense.category, locale)}
                  </span>
                </div>
                
                {expense.note && (
                  <p className="text-sm font-medium text-zinc-600 mt-1 break-words line-clamp-2">
                    {expense.note}
                  </p>
                )}
                
                <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-zinc-400 mt-3">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(expense.date), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {expense.user.name}
                  </span>
                  {expense.location && (
                    <span className="flex items-center gap-1.5 text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded-md">
                      <MapPin className="w-3 h-3" />
                      {expense.location}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions - Floating on desktop, always visible on mobile but subtle */}
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity absolute right-4 top-4 sm:relative sm:right-auto sm:top-auto">
                <button
                  onClick={() => setEditingExpense(expense)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(expense.id)}
                  disabled={deletingId === expense.id}
                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Delete"
                >
                  {deletingId === expense.id ? (
                    <span className="animate-spin block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Expense Modal */}
      {editingExpense && !isAccommodation(editingExpense) && (
        <EditExpenseModal
          isOpen={true}
          onClose={handleCloseModal}
          expense={editingExpense}
          tripId={tripId}
          categories={categories}
          defaultLocation={defaultLocation}
        />
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(ExpenseList);
