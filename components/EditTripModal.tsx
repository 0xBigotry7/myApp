"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  X,
  MapPin,
  Calendar,
  DollarSign,
  Loader2,
  Check,
  Trash2,
  Plus,
  AlertTriangle,
  Pencil
} from "lucide-react";

interface BudgetCategory {
  id?: string;
  category: string;
  budgetAmount: number;
}

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string | Date;
  endDate: string | Date;
  totalBudget: number;
  currency: string;
  description?: string | null;
  budgetCategories: BudgetCategory[];
}

interface EditTripModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  "Accommodation",
  "Transportation",
  "Food & Dining",
  "Activities",
  "Shopping",
  "Entertainment",
  "Other",
];

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "AUD", symbol: "$", name: "Australian Dollar" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar" },
];

export default function EditTripModal({ trip, isOpen, onClose }: EditTripModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(trip.name);
  const [destination, setDestination] = useState(trip.destination);
  const [startDate, setStartDate] = useState(format(new Date(trip.startDate), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(trip.endDate), "yyyy-MM-dd"));
  const [totalBudget, setTotalBudget] = useState(trip.totalBudget.toString());
  const [currency, setCurrency] = useState(trip.currency);
  const [description, setDescription] = useState(trip.description || "");
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(
    trip.budgetCategories.length > 0
      ? trip.budgetCategories
      : [{ category: "Accommodation", budgetAmount: 0 }]
  );

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading && !isDeleting) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isLoading, isDeleting, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          destination,
          startDate,
          endDate,
          totalBudget: parseFloat(totalBudget),
          currency,
          description: description || null,
          budgetCategories: budgetCategories.filter(bc => bc.budgetAmount > 0),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update trip");
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete trip");
      }

      router.push("/trips");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsDeleting(false);
    }
  };

  const addBudgetCategory = () => {
    const usedCategories = budgetCategories.map(bc => bc.category);
    const availableCategory = CATEGORIES.find(c => !usedCategories.includes(c));
    if (availableCategory) {
      setBudgetCategories([...budgetCategories, { category: availableCategory, budgetAmount: 0 }]);
    }
  };

  const updateBudgetCategory = (index: number, field: "category" | "budgetAmount", value: string | number) => {
    const updated = [...budgetCategories];
    if (field === "budgetAmount") {
      updated[index].budgetAmount = typeof value === "string" ? parseFloat(value) || 0 : value;
    } else {
      updated[index].category = value as string;
    }
    setBudgetCategories(updated);
  };

  const removeBudgetCategory = (index: number) => {
    if (budgetCategories.length > 1) {
      setBudgetCategories(budgetCategories.filter((_, i) => i !== index));
    }
  };

  const totalCategoryBudget = budgetCategories.reduce((sum, bc) => sum + (bc.budgetAmount || 0), 0);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => !isLoading && !isDeleting && onClose()}
      />

      {/* Modal Container */}
      <div className="pointer-events-auto relative bg-zinc-50 dark:bg-zinc-900 w-full sm:max-w-2xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <span className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 w-8 h-8 rounded-lg flex items-center justify-center">
              <Pencil className="w-4 h-4" />
            </span>
            Edit Trip
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading || isDeleting}
            className="p-2 -mr-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950">
          <div className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Trip Name */}
            <div>
              <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 block">
                Trip Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                placeholder="Summer Vacation 2024"
                required
              />
            </div>

            {/* Destination */}
            <div>
              <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 block">
                Destination
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                  placeholder="Tokyo, Japan"
                  required
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 block">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 block">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Budget & Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 block">
                  Total Budget
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                  <input
                    type="number"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 block">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all appearance-none"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 block">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white resize-none transition-all"
                placeholder="Trip notes, plans, or reminders..."
              />
            </div>

            {/* Budget Categories */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Budget Breakdown
                </label>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                  totalCategoryBudget > parseFloat(totalBudget || "0") 
                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" 
                    : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                }`}>
                  {CURRENCIES.find(c => c.code === currency)?.symbol}
                  {totalCategoryBudget.toLocaleString()} / {CURRENCIES.find(c => c.code === currency)?.symbol}
                  {parseFloat(totalBudget || "0").toLocaleString()}
                </span>
              </div>
              <div className="space-y-3">
                {budgetCategories.map((bc, index) => (
                  <div key={index} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                    <select
                      value={bc.category}
                      onChange={(e) => updateBudgetCategory(index, "category", e.target.value)}
                      className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-zinc-200 dark:focus:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none transition-all appearance-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} disabled={budgetCategories.some((b, i) => i !== index && b.category === cat)}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-bold">
                        {CURRENCIES.find(c => c.code === currency)?.symbol}
                      </span>
                      <input
                        type="number"
                        value={bc.budgetAmount || ""}
                        onChange={(e) => updateBudgetCategory(index, "budgetAmount", e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="0"
                        className="w-full pl-8 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-zinc-200 dark:focus:border-zinc-700 rounded-xl text-sm font-bold text-zinc-900 dark:text-white focus:outline-none transition-all text-right"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBudgetCategory(index)}
                      disabled={budgetCategories.length === 1}
                      className="p-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {budgetCategories.length < CATEGORIES.length && (
                  <button
                    type="button"
                    onClick={addBudgetCategory}
                    className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Budget Category
                  </button>
                )}
              </div>
            </div>

            {/* Delete Section */}
            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
              {showDeleteConfirm ? (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/50 rounded-2xl p-5 animate-in zoom-in-95 duration-200">
                  <h4 className="font-bold text-red-700 dark:text-red-400 mb-1">Delete Trip?</h4>
                  <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
                    This action cannot be undone. All expenses and data associated with this trip will be permanently removed.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 py-2.5 px-4 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-red-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Yes, Delete Trip"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-4 text-sm font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Trip
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading || isDeleting}
            className="px-6 py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || isDeleting}
            className="flex-1 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold shadow-lg shadow-zinc-200 dark:shadow-zinc-900/50 hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

