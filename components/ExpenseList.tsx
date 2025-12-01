"use client";

import { format } from "date-fns";
import { useLocale } from "@/components/LanguageSwitcher";
import { getTranslations, translateCategory } from "@/lib/i18n";
import { useState, useCallback, memo, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import AccommodationExpenseCardCompact from "./AccommodationExpenseCardCompact";
import EditExpenseModal from "./EditExpenseModal";
import EditTransactionModal from "./EditTransactionModal";
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
  // Transaction fields (for unified transactions)
  isTransaction?: boolean; // Flag to identify if this is a transaction vs legacy expense
  accountId?: string; // Account ID for transactions
  user: {
    name: string;
    email: string;
  };
}

interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
}

interface Trip {
  id: string;
  name: string;
  destination: string;
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
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  // Fetch accounts and trips for the edit modal
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsRes, tripsRes] = await Promise.all([
          fetch("/api/accounts"),
          fetch("/api/trips"),
        ]);
        if (accountsRes.ok) {
          const data = await accountsRes.json();
          setAccounts(data.accounts || data || []);
        }
        if (tripsRes.ok) {
          const data = await tripsRes.json();
          setTrips(data.trips || data || []);
        }
      } catch (error) {
        console.error("Error fetching data for edit modal:", error);
      }
    };
    fetchData();
  }, []);

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

  const handleDelete = useCallback(async (expenseId: string, isTransaction?: boolean) => {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    setDeletingId(expenseId);
    try {
      // Use transaction API if it's a transaction, otherwise use expense API
      const apiPath = isTransaction 
        ? `/api/transactions/${expenseId}`
        : `/api/expenses/${expenseId}`;
      
      const response = await fetch(apiPath, {
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
      <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-100 dark:border-zinc-800 p-12 text-center">
        <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Receipt className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{t.recentExpenses}</h3>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">{t.noExpensesYet}</p>
      </div>
    );
  }

  const isAccommodation = (expense: Expense) => {
    return expense.category === "Accommodation" || expense.accommodationName != null;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500 dark:text-zinc-400">
          <Receipt className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{t.recentExpenses}</h3>
      </div>
      
      <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
        {expenses.map((expense) => {
          if (isAccommodation(expense)) {
            return (
              <div key={expense.id} className="p-4 sm:p-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                <AccommodationExpenseCardCompact
                  expense={expense}
                  userColor={{ bg: "bg-zinc-50 dark:bg-zinc-800", badge: "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200" }}
                  onEdit={() => router.push(`/trips/${tripId}/edit-accommodation/${expense.id}`)}
                  onDelete={() => handleDelete(expense.id)}
                />
              </div>
            );
          }

          return (
            <div
              key={expense.id}
              className="group relative flex items-start p-4 sm:p-6 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-all"
            >
              {/* Category Icon */}
              <div className="mr-5 mt-1 hidden sm:block">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 border border-zinc-100 dark:border-zinc-700 shadow-sm group-hover:scale-105 transition-transform">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>

              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center flex-wrap gap-3 mb-1.5">
                  <span className="font-black text-lg text-zinc-900 dark:text-white tracking-tight">
                    {getCurrencySymbol(expense.currency)}{expense.amount.toFixed(2)}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                    {translateCategory(expense.category, locale)}
                  </span>
                </div>
                
                {expense.note && (
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mt-1 break-words line-clamp-2">
                    {expense.note}
                  </p>
                )}
                
                <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-zinc-400 dark:text-zinc-500 mt-3">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(expense.date), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {expense.user.name}
                  </span>
                  {expense.location && (
                    <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      <MapPin className="w-3 h-3" />
                      {expense.location}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions - Floating on desktop, always visible on mobile but subtle */}
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity absolute right-4 top-4 sm:relative sm:right-auto sm:top-auto">
                {expense.isTransaction ? (
                  // For transactions, open edit modal
                  <button
                    onClick={() => {
                      setEditingTransaction({
                        id: expense.id,
                        amount: -expense.amount, // Convert back to negative for expense
                        category: expense.category,
                        description: expense.note,
                        date: new Date(expense.date).toISOString(),
                        accountId: expense.accountId || accounts[0]?.id || "",
                        tripId: tripId,
                        location: expense.location,
                        isTripRelated: true,
                        isRecurring: false,
                        currency: expense.currency,
                      });
                    }}
                    className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                ) : (
                  // For legacy expenses, use the modal
                  <button
                    onClick={() => setEditingExpense(expense)}
                    className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(expense.id, expense.isTransaction)}
                  disabled={deletingId === expense.id}
                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl transition-all"
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

      {/* Edit Expense Modal (for legacy expenses) */}
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

      {/* Edit Transaction Modal (for unified transactions) */}
      <EditTransactionModal
        transaction={editingTransaction}
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        accounts={accounts}
        trips={trips}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(ExpenseList);
