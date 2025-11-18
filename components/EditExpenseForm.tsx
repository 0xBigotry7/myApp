"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations, translateCategory } from "@/lib/i18n";
import LocationAutocomplete from "./LocationAutocomplete";
import CategorySpecificFields from "./CategorySpecificFields";

interface EditExpenseFormProps {
  expense: {
    id: string;
    amount: number;
    category: string;
    currency: string;
    date: Date;
    note: string | null;
    location: string | null;
    receiptUrl: string | null;
    // Category-specific fields
    transportationDistance?: number | null;
    transportationDuration?: number | null;
    ticketReference?: string | null;
    numberOfPassengers?: number | null;
    partySize?: number | null;
    mealType?: string | null;
    cuisineType?: string | null;
    restaurantName?: string | null;
    hasReservation?: boolean | null;
    activityType?: string | null;
    activityName?: string | null;
    activityDuration?: number | null;
    numberOfTickets?: number | null;
    activityReference?: string | null;
    hasGuide?: boolean | null;
    storeName?: string | null;
    shoppingCategory?: string | null;
    numberOfItems?: number | null;
    hasReturnPolicy?: boolean | null;
    isGift?: boolean | null;
    giftRecipient?: string | null;
    otherSubcategory?: string | null;
    expenseRating?: number | null;
  };
  tripId: string;
  categories: string[];
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultLocation?: string;
}

export default function EditExpenseForm({
  expense,
  tripId,
  categories,
  onSuccess,
  onCancel,
  defaultLocation,
}: EditExpenseFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = getTranslations(locale);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(expense.receiptUrl);

  // Filter out Accommodation from categories (use dedicated booking flow instead)
  const availableCategories = categories.filter(cat => cat !== "Accommodation");

  const [formData, setFormData] = useState({
    amount: expense.amount.toString(),
    category: expense.category,
    date: new Date(expense.date).toISOString().split("T")[0],
    time: "",
    currency: expense.currency,
    location: expense.location || defaultLocation || "",
    note: expense.note || "",
    // Category-specific fields
    transportationDistance: expense.transportationDistance ?? null,
    transportationDuration: expense.transportationDuration ?? null,
    ticketReference: expense.ticketReference ?? null,
    numberOfPassengers: expense.numberOfPassengers ?? null,
    partySize: expense.partySize ?? null,
    mealType: expense.mealType ?? null,
    cuisineType: expense.cuisineType ?? null,
    restaurantName: expense.restaurantName ?? null,
    hasReservation: expense.hasReservation ?? null,
    activityType: expense.activityType ?? null,
    activityName: expense.activityName ?? null,
    activityDuration: expense.activityDuration ?? null,
    numberOfTickets: expense.numberOfTickets ?? null,
    activityReference: expense.activityReference ?? null,
    hasGuide: expense.hasGuide ?? null,
    storeName: expense.storeName ?? null,
    shoppingCategory: expense.shoppingCategory ?? null,
    numberOfItems: expense.numberOfItems ?? null,
    hasReturnPolicy: expense.hasReturnPolicy ?? null,
    isGift: expense.isGift ?? null,
    giftRecipient: expense.giftRecipient ?? null,
    otherSubcategory: expense.otherSubcategory ?? null,
    expenseRating: expense.expenseRating ?? null,
  });

  // Determine date input type based on category
  const needsTime = ["Transportation", "Activities"].includes(formData.category);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(expense.receiptUrl);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCategoryFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let receiptUrl = expense.receiptUrl;

      // Upload new receipt if selected
      if (selectedFile) {
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedFile);

        const uploadRes = await fetch("/api/upload-photo", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload receipt");
        }

        const { url } = await uploadRes.json();
        receiptUrl = url;
        setUploading(false);
      }

      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          category: formData.category,
          date: formData.time
            ? new Date(`${formData.date}T${formData.time}:00`)
            : new Date(`${formData.date}T12:00:00`),
          currency: formData.currency,
          location: formData.location || undefined,
          note: formData.note || undefined,
          receiptUrl: receiptUrl || undefined,
          // Category-specific fields
          transportationDistance: formData.transportationDistance,
          transportationDuration: formData.transportationDuration,
          ticketReference: formData.ticketReference,
          numberOfPassengers: formData.numberOfPassengers,
          partySize: formData.partySize,
          mealType: formData.mealType,
          cuisineType: formData.cuisineType,
          restaurantName: formData.restaurantName,
          hasReservation: formData.hasReservation,
          activityType: formData.activityType,
          activityName: formData.activityName,
          activityDuration: formData.activityDuration,
          numberOfTickets: formData.numberOfTickets,
          activityReference: formData.activityReference,
          hasGuide: formData.hasGuide,
          storeName: formData.storeName,
          shoppingCategory: formData.shoppingCategory,
          numberOfItems: formData.numberOfItems,
          hasReturnPolicy: formData.hasReturnPolicy,
          isGift: formData.isGift,
          giftRecipient: formData.giftRecipient,
          otherSubcategory: formData.otherSubcategory,
          expenseRating: formData.expenseRating,
        }),
      });

      if (response.ok) {
        // Clean up preview URL if we created one
        if (selectedFile && previewUrl && previewUrl !== expense.receiptUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/trips/${tripId}`);
          router.refresh();
        }
      } else {
        alert("Failed to update expense");
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      alert("Error updating expense");
    } finally {
      setLoading(false);
      setUploading(false);
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
          {availableCategories.map((cat) => (
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
            <option value="THB">🇹🇭 THB</option>
          </select>
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          📍 {t.location}{" "}
          <span className="text-gray-400 font-normal">({t.optional})</span>
        </label>
        <LocationAutocomplete
          value={formData.location}
          onChange={(value) => setFormData({ ...formData, location: value })}
          placeholder="e.g., Starbucks, Times Square"
          className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-400"
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

      {/* Category-Specific Fields */}
      <CategorySpecificFields
        category={formData.category}
        formData={formData}
        onChange={handleCategoryFieldChange}
      />

      {/* Receipt Photo */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          📷 Receipt Photo{" "}
          <span className="text-gray-400 font-normal">({t.optional})</span>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
        {previewUrl ? (
          <div className="relative group">
            <img
              src={previewUrl.includes('drive.google.com') || previewUrl.includes('googleusercontent.com')
                ? `/api/proxy-image?url=${encodeURIComponent(previewUrl)}`
                : previewUrl}
              alt="Receipt preview"
              className="w-full max-w-md h-64 object-cover rounded-xl border-2 border-gray-200"
            />
            <button
              type="button"
              onClick={handleRemoveFile}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold hover:bg-red-600 transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:shadow-lg transition-all"
          >
            Choose Photo
          </button>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="pt-4 space-y-3">
        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full bg-gradient-sunset-pink text-white py-5 rounded-2xl font-bold text-xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
        >
          {uploading
            ? "📤 Uploading..."
            : loading
            ? `💾 ${t.saving}`
            : `✓ ${t.save} ${t.addExpense}`}
        </button>

        <button
          type="button"
          onClick={() => onCancel ? onCancel() : router.back()}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-all"
        >
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
