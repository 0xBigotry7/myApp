"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  X,
  Loader2,
  DollarSign,
  Calendar,
  MapPin,
  Tag,
  CreditCard,
  FileText,
  Plane,
  Home,
  Receipt,
  Check,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  icon?: string;
  color?: string;
}

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

interface Transaction {
  id: string;
  amount: number;
  category: string;
  merchantName?: string;
  description?: string;
  date: string;
  accountId: string;
  receiptUrl?: string;
  isRecurring: boolean;
  isTripRelated: boolean;
  tripId?: string | null;
  location?: string | null;
  currency?: string | null;
}

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  trips: Trip[];
  onSuccess?: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIES: Record<string, { icon: string; color: string }> = {
  Groceries: { icon: "🛒", color: "bg-emerald-50 text-emerald-600 ring-emerald-200" },
  Dining: { icon: "🍽️", color: "bg-orange-50 text-orange-600 ring-orange-200" },
  Transportation: { icon: "🚗", color: "bg-blue-50 text-blue-600 ring-blue-200" },
  Utilities: { icon: "⚡", color: "bg-yellow-50 text-yellow-600 ring-yellow-200" },
  "Rent/Mortgage": { icon: "🏠", color: "bg-rose-50 text-rose-600 ring-rose-200" },
  Entertainment: { icon: "🎬", color: "bg-pink-50 text-pink-600 ring-pink-200" },
  Shopping: { icon: "🛍️", color: "bg-purple-50 text-purple-600 ring-purple-200" },
  Healthcare: { icon: "⚕️", color: "bg-cyan-50 text-cyan-600 ring-cyan-200" },
  Subscriptions: { icon: "📱", color: "bg-indigo-50 text-indigo-600 ring-indigo-200" },
  Travel: { icon: "✈️", color: "bg-sky-50 text-sky-600 ring-sky-200" },
  Accommodation: { icon: "🏨", color: "bg-violet-50 text-violet-600 ring-violet-200" },
  Activities: { icon: "🎫", color: "bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-200" },
  Food: { icon: "🍜", color: "bg-amber-50 text-amber-600 ring-amber-200" },
  Salary: { icon: "💰", color: "bg-emerald-50 text-emerald-600 ring-emerald-200" },
  Freelance: { icon: "💻", color: "bg-blue-50 text-blue-600 ring-blue-200" },
  Investment: { icon: "📈", color: "bg-violet-50 text-violet-600 ring-violet-200" },
  Gift: { icon: "🎁", color: "bg-pink-50 text-pink-600 ring-pink-200" },
  Other: { icon: "📦", color: "bg-zinc-100 text-zinc-600 ring-zinc-200" },
};

const EXPENSE_CATEGORIES = ["Groceries", "Dining", "Transportation", "Utilities", "Rent/Mortgage", "Entertainment", "Shopping", "Healthcare", "Subscriptions", "Travel", "Accommodation", "Activities", "Food", "Other"];
const INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Gift", "Other"];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EditTransactionModal({
  transaction,
  isOpen,
  onClose,
  accounts,
  trips,
  onSuccess,
}: EditTransactionModalProps) {
  const router = useRouter();

  // Form state
  const [amount, setAmount] = useState("");
  const [isIncome, setIsIncome] = useState(false);
  const [category, setCategory] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [tripId, setTripId] = useState<string | null>(null);
  const [location, setLocation] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize form when transaction changes
  useEffect(() => {
    if (transaction) {
      setAmount(Math.abs(transaction.amount).toString());
      setIsIncome(transaction.amount > 0);
      setCategory(transaction.category || "");
      setMerchantName(transaction.merchantName || "");
      setDescription(transaction.description || "");
      setDate(format(new Date(transaction.date), "yyyy-MM-dd"));
      setAccountId(transaction.accountId);
      setTripId(transaction.tripId || null);
      setLocation(transaction.location || "");
      setError(null);
      setShowSuccess(false);
    }
  }, [transaction]);

  // Store scroll position and handle modal
  const scrollPositionRef = useRef(0);
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onClose();
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      
      // Save current scroll position
      scrollPositionRef.current = window.scrollY;
      
      // Scroll to top so modal is visible (since it's centered at top)
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // Lock scroll
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Restore scroll position when modal closes
      if (scrollPositionRef.current > 0) {
        window.scrollTo({ top: scrollPositionRef.current, behavior: 'instant' });
      }
    };
  }, [isOpen, isLoading, onClose]);

  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    setIsLoading(true);
    setError(null);

    try {
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      const finalAmount = isIncome ? numericAmount : -numericAmount;

      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          amount: finalAmount,
          category,
          merchantName: merchantName || null,
          description: description || null,
          date: new Date(date).toISOString(),
          tripId: tripId || null,
          location: location || null,
          isTripRelated: !!tripId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update transaction");
      }

      setShowSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isOpen) {
    return null;
  }

  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const selectedCategory = CATEGORIES[category] || CATEGORIES.Other;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
      />

      {/* Modal - positioned at top with margin */}
      <div 
        className="fixed left-1/2 bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl max-h-[85vh] overflow-auto flex flex-col"
        style={{
          top: '20px',
          transform: 'translateX(-50%)',
        }}
      >
        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-zinc-900 dark:text-white">Transaction Updated!</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <Receipt className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Edit Transaction</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-xl animate-in slide-in-from-top-2 duration-200">
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
              </div>
            )}

            {/* Type Toggle */}
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => { setIsIncome(false); setCategory(""); }}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${!isIncome
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => { setIsIncome(true); setCategory(""); }}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${isIncome
                    ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
              >
                Income
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className={`w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-2xl font-bold focus:ring-2 focus:border-transparent transition-all ${isIncome
                      ? "text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500"
                      : "text-zinc-900 dark:text-white focus:ring-zinc-300 dark:focus:ring-zinc-600"
                    }`}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Category</label>
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const config = CATEGORIES[cat] || CATEGORIES.Other;
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-3 rounded-xl text-center transition-all duration-200 ${isSelected
                          ? `${config.color.split(' ').slice(0, 2).join(' ')} ring-2 ${config.color.split(' ')[2]} scale-105`
                          : "bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        }`}
                    >
                      <div className="text-xl mb-1">{config.icon}</div>
                      <div className={`text-[10px] font-semibold truncate ${isSelected ? '' : 'text-zinc-600 dark:text-zinc-400'}`}>
                        {cat.split("/")[0]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Merchant & Description */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Merchant</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="e.g., Walmart"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Account */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Account</label>
              <div className="grid grid-cols-2 gap-2">
                {accounts.slice(0, 4).map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setAccountId(account.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all ${accountId === account.id
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                        : "bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white"
                      }`}
                  >
                    <span className="text-lg">
                      {account.type === "checking" ? "🏦" : account.type === "credit_card" ? "💳" : "💰"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{account.name}</div>
                      <div className={`text-xs ${accountId === account.id ? "text-white/60 dark:text-zinc-900/60" : "text-zinc-400"}`}>
                        {account.currency}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trip Association */}
            {trips.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Link to Trip (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTripId(null)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${!tripId
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                        : "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      }`}
                  >
                    <Home className="w-4 h-4" />
                    Personal
                  </button>
                  {trips.slice(0, 3).map((trip) => (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => setTripId(trip.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${tripId === trip.id
                          ? "bg-purple-600 text-white"
                          : "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        }`}
                    >
                      <Plane className="w-4 h-4" />
                      {trip.name || trip.destination}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Notes (Optional)</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any additional details..."
                  rows={2}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-600 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Location (Optional)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., New York, NY"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-600 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 shrink-0">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3.5 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !amount || !category || !accountId}
                className="flex-1 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
