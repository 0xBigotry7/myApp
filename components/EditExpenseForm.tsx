"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations, translateCategory } from "@/lib/i18n";
import LocationAutocomplete from "./LocationAutocomplete";
import CategorySpecificFields from "./CategorySpecificFields";
import { 
  DollarSign, 
  Tag, 
  Calendar, 
  Clock, 
  CreditCard, 
  MapPin, 
  FileText, 
  Camera, 
  X, 
  Save, 
  Loader2 
} from "lucide-react";

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount */}
      <div>
        <label className="block text-sm font-semibold text-zinc-700 mb-2">
          {t.amount}
        </label>
        <div className="relative">
          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            required
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            className="w-full pl-12 pr-6 py-4 text-2xl font-bold border-2 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder:text-zinc-300"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-zinc-700 mb-3">
          {t.category}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFormData({ ...formData, category: cat })}
              className={`px-4 py-3 rounded-xl font-medium text-sm transition-all border-2 ${
                formData.category === cat
                  ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              {translateCategory(cat, locale)}
            </button>
          ))}
        </div>
      </div>

      {/* Date and Time - Adaptive based on category */}
      <div className="space-y-4">
        {needsTime ? (
          // Date + Time for Transportation & Activities
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                {t.date}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 text-sm border-2 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                {t.time} <span className="text-zinc-400 font-normal text-xs">({t.optional})</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 text-sm border-2 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        ) : (
          // Single Date for other categories
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              {t.date}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full pl-10 pr-4 py-3 text-sm border-2 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        {/* Currency */}
        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            {t.currency}
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <select
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
              className="w-full pl-10 pr-4 py-3 text-sm border-2 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all appearance-none bg-white"
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
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-semibold text-zinc-700 mb-2">
          {t.location} <span className="text-zinc-400 font-normal text-xs">({t.optional})</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <LocationAutocomplete
            value={formData.location}
            onChange={(value) => setFormData({ ...formData, location: value })}
            placeholder="e.g., Starbucks, Times Square"
            className="w-full pl-10 pr-4 py-3 text-sm border-2 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-semibold text-zinc-700 mb-2">
          {t.note} <span className="text-zinc-400 font-normal text-xs">({t.optional})</span>
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
          <textarea
            value={formData.note}
            onChange={(e) =>
              setFormData({ ...formData, note: e.target.value })
            }
            rows={3}
            className="w-full pl-10 pr-4 py-3 text-sm border-2 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder:text-zinc-400 resize-none"
            placeholder="e.g., Dinner with friends"
          />
        </div>
      </div>

      {/* Category-Specific Fields */}
      <CategorySpecificFields
        category={formData.category}
        formData={formData}
        onChange={handleCategoryFieldChange}
      />

      {/* Receipt Photo */}
      <div>
        <label className="block text-sm font-semibold text-zinc-700 mb-2">
          Receipt Photo <span className="text-zinc-400 font-normal text-xs">({t.optional})</span>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
        {previewUrl ? (
          <div className="relative group w-full max-w-xs">
            <img
              src={previewUrl.includes('drive.google.com') || previewUrl.includes('googleusercontent.com')
                ? `/api/proxy-image?url=${encodeURIComponent(previewUrl)}`
                : previewUrl}
              alt="Receipt preview"
              className="w-full h-48 object-cover rounded-xl border-2 border-zinc-200"
            />
            <button
              type="button"
              onClick={handleRemoveFile}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 w-full bg-zinc-50 border-2 border-dashed border-zinc-300 text-zinc-600 py-4 px-6 rounded-2xl font-medium hover:bg-zinc-100 hover:border-zinc-400 transition-all"
          >
            <Camera className="w-5 h-5" />
            Upload Photo
          </button>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => onCancel ? onCancel() : router.back()}
          className="flex-1 py-3.5 bg-white border-2 border-zinc-200 text-zinc-700 rounded-xl font-semibold hover:bg-zinc-50 hover:border-zinc-300 transition-all"
        >
          {t.cancel}
        </button>
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {(loading || uploading) ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {uploading ? "Uploading..." : t.saving}
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {t.save}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
