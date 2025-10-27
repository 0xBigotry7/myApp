"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations, translateCategory } from "@/lib/i18n";
import { getSubcategoriesForCategory } from "@/lib/subcategories";

interface EditExpenseFormProps {
  expense: {
    id: string;
    amount: number;
    category: string;
    subcategory: string | null;
    currency: string;
    date: Date;
    note: string | null;
    location: string | null;
  };
  tripId: string;
  categories: string[];
}

export default function EditExpenseForm({
  expense,
  tripId,
  categories,
}: EditExpenseFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = getTranslations(locale);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    amount: expense.amount.toString(),
    category: expense.category,
    subcategory: expense.subcategory || "",
    date: new Date(expense.date).toISOString().split("T")[0],
    time: "",
    currency: expense.currency,
    location: expense.location || "",
    note: expense.note || "",
  });

  // Determine date input type based on category
  const needsTime = ["Transportation", "Activities"].includes(formData.category);

  // Get subcategories for selected category
  const availableSubcategories = getSubcategoriesForCategory(formData.category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          category: formData.category,
          subcategory: formData.subcategory || undefined,
          date: formData.time
            ? new Date(`${formData.date}T${formData.time}:00`)
            : new Date(formData.date),
          currency: formData.currency,
          location: formData.location || undefined,
          note: formData.note || undefined,
        }),
      });

      if (response.ok) {
        router.push(`/trips/${tripId}`);
        router.refresh();
      } else {
        alert("Failed to update expense");
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      alert("Error updating expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Amount */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          💵 {t.amount}
        </label>
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">
            $
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            required
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            className="w-full pl-12 pr-6 py-5 text-3xl font-bold border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-sunset-400 focus:border-transparent transition-all placeholder:text-gray-300"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          🏷️ {t.category}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFormData({ ...formData, category: cat })}
              className={`px-5 py-5 rounded-2xl font-semibold text-base transition-all touch-manipulation min-h-[60px] ${
                formData.category === cat
                  ? "bg-gradient-sunset-pink text-white shadow-lg scale-105"
                  : "bg-white border-2 border-gray-300 text-gray-700 hover:border-sunset-400 hover:bg-sunset-50 active:scale-95"
              }`}
            >
              {translateCategory(cat, locale)}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategory */}
      {availableSubcategories.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            🔖 Subcategory <span className="text-gray-400 font-normal">({t.optional})</span>
          </label>
          <select
            value={formData.subcategory}
            onChange={(e) =>
              setFormData({ ...formData, subcategory: e.target.value })
            }
            className="w-full px-4 py-4 text-base border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              backgroundSize: "1.25rem",
            }}
          >
            <option value="">Select subcategory...</option>
            {availableSubcategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Date and Time - Adaptive based on category */}
      <div className="space-y-3">
        {needsTime ? (
          // Date + Time for Transportation & Activities
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                📅 {t.date}
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-4 text-base border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                🕐 {t.time} <span className="text-gray-400 font-normal">({t.optional})</span>
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                className="w-full px-4 py-4 text-base border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        ) : (
          // Single Date for other categories
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              📅 {t.date}
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-4 py-4 text-base border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
        )}

        {/* Currency */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            💱 {t.currency}
          </label>
          <select
            value={formData.currency}
            onChange={(e) =>
              setFormData({ ...formData, currency: e.target.value })
            }
            className="w-full px-4 py-4 text-base border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              backgroundSize: "1.25rem",
            }}
          >
            <option value="USD">🇺🇸 USD</option>
            <option value="EUR">🇪🇺 EUR</option>
            <option value="GBP">🇬🇧 GBP</option>
            <option value="JPY">🇯🇵 JPY</option>
            <option value="CNY">🇨🇳 CNY</option>
          </select>
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          📍 {t.location}{" "}
          <span className="text-gray-400 font-normal">({t.optional})</span>
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
          className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-400"
          placeholder="e.g., Starbucks, Times Square"
        />
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          📝 {t.note}{" "}
          <span className="text-gray-400 font-normal">({t.optional})</span>
        </label>
        <textarea
          value={formData.note}
          onChange={(e) =>
            setFormData({ ...formData, note: e.target.value })
          }
          rows={3}
          className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-400 resize-none"
          placeholder="e.g., Dinner with friends"
        />
      </div>

      {/* Submit Buttons */}
      <div className="pt-4 space-y-3">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-sunset-pink text-white py-5 rounded-2xl font-bold text-xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
        >
          {loading ? `💾 ${t.saving}` : `✓ ${t.save} ${t.addExpense}`}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-all"
        >
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
