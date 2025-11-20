"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations, translateCategory } from "@/lib/i18n";
import LocationAutocomplete from "./LocationAutocomplete";
import CategorySpecificFields from "./CategorySpecificFields";
import { 
  Sparkles, 
  Camera, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  DollarSign, 
  Lightbulb, 
  Tag, 
  Calendar, 
  Clock, 
  CreditCard, 
  MapPin, 
  FileText, 
  X,
  Plus
} from "lucide-react";

interface ExpenseInputFormProps {
  tripId: string;
  categories: string[];
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultLocation?: string;
}

export default function ExpenseInputForm({
  tripId,
  categories,
  onSuccess,
  onCancel,
  defaultLocation,
}: ExpenseInputFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = getTranslations(locale);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Filter out Accommodation from categories (use dedicated booking flow instead)
  const availableCategories = categories.filter(cat => cat !== "Accommodation");

  const [formData, setFormData] = useState({
    amount: "",
    category: availableCategories[0] || "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    currency: "USD",
    location: defaultLocation || "",
    note: "",
    // Category-specific fields (all optional)
    transportationDistance: null as number | null,
    transportationDuration: null as number | null,
    ticketReference: null as string | null,
    numberOfPassengers: null as number | null,
    partySize: null as number | null,
    mealType: null as string | null,
    cuisineType: null as string | null,
    restaurantName: null as string | null,
    hasReservation: null as boolean | null,
    activityType: null as string | null,
    activityName: null as string | null,
    activityDuration: null as number | null,
    numberOfTickets: null as number | null,
    activityReference: null as string | null,
    hasGuide: null as boolean | null,
    storeName: null as string | null,
    shoppingCategory: null as string | null,
    numberOfItems: null as number | null,
    hasReturnPolicy: null as boolean | null,
    isGift: null as boolean | null,
    giftRecipient: null as string | null,
    otherSubcategory: null as string | null,
    expenseRating: null as number | null,
  });

  const [baseAmount, setBaseAmount] = useState("");
  const [selectedTip, setSelectedTip] = useState<number | null>(null);

  // Determine date input type based on category
  const needsTime = ["Transportation", "Activities"].includes(formData.category);

  // Check if category is food/restaurant related
  const isFoodCategory = formData.category.toLowerCase().includes("food") ||
                         formData.category.toLowerCase().includes("restaurant") ||
                         formData.category.toLowerCase().includes("dining");

  // Handle tip calculation
  const handleTipSelect = (tipPercentage: number) => {
    if (!baseAmount || isNaN(parseFloat(baseAmount))) return;

    const base = parseFloat(baseAmount);
    const tipAmount = base * (tipPercentage / 100);
    const total = base + tipAmount;

    setSelectedTip(tipPercentage);
    setFormData({ ...formData, amount: total.toFixed(2) });
  };

  const handleBaseAmountChange = (value: string) => {
    setBaseAmount(value);
    setFormData({ ...formData, amount: value });
    setSelectedTip(null);
  };

  const handleCategoryFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileSelect = async (file: File) => {
    setReceiptFile(file);

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Scan with AI
    setScanning(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ai/scan-receipt", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          amount: data.amount?.toString() || prev.amount,
          category: data.category || prev.category,
          date: data.date || prev.date,
          location: data.location || prev.location,
          note: data.note || prev.note,
          currency: data.currency || prev.currency,
        }));
        setBaseAmount(data.amount?.toString() || "");
      }
    } catch (error) {
      console.error("Error scanning receipt:", error);
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let receiptUrl = null;

      // Upload receipt if provided
      if (receiptFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", receiptFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          receiptUrl = data.url;
        }
      }

      // Create expense with proper timezone handling
      let expenseDate;
      if (formData.time) {
        expenseDate = new Date(`${formData.date}T${formData.time}:00`);
      } else {
        expenseDate = new Date(`${formData.date}T12:00:00`);
      }

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripId,
          amount: parseFloat(formData.amount),
          category: formData.category,
          date: expenseDate.toISOString(),
          currency: formData.currency,
          location: formData.location || undefined,
          note: formData.note || undefined,
          receiptUrl,
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
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/trips/${tripId}`);
          router.refresh();
        }
      } else {
        alert("Failed to add expense");
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Error adding expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI Receipt Scanner */}
      <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <div>
              <h3 className="font-bold text-zinc-900 text-sm">AI Receipt Scan</h3>
              <p className="text-xs text-zinc-500">Auto-fill from photo</p>
            </div>
          </div>
          {receiptFile && (
            <button
              type="button"
              onClick={() => {
                setReceiptFile(null);
                setPreviewUrl(null);
              }}
              className="text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          )}
        </div>

        {!receiptFile ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center gap-1.5 py-4 bg-white rounded-xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all group"
            >
              <Camera className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900" />
              <span className="text-xs font-medium text-zinc-600 group-hover:text-zinc-900">Camera</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1.5 py-4 bg-white rounded-xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all group"
            >
              <Upload className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900" />
              <span className="text-xs font-medium text-zinc-600 group-hover:text-zinc-900">Upload</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {previewUrl && (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-zinc-200">
                <Image
                  src={previewUrl}
                  alt="Receipt"
                  fill
                  className="object-contain bg-white"
                />
              </div>
            )}
            {scanning ? (
              <div className="flex items-center justify-center gap-2 py-2 bg-purple-50 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Scanning...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2 bg-emerald-50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Scanned successfully</span>
              </div>
            )}
          </div>
        )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="hidden"
        />
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm font-semibold text-zinc-700 mb-2">
          {isFoodCategory ? "Subtotal (before tip)" : "Amount"}
        </label>
        <div className="relative">
          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            required
            value={isFoodCategory ? baseAmount : formData.amount}
            onChange={(e) =>
              isFoodCategory
                ? handleBaseAmountChange(e.target.value)
                : setFormData({ ...formData, amount: e.target.value })
            }
            className="w-full pl-10 pr-4 py-4 text-2xl font-bold border-2 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder:text-zinc-300"
            placeholder="0.00"
          />
        </div>

        {/* Tip Calculator */}
        {isFoodCategory && baseAmount && !isNaN(parseFloat(baseAmount)) && (
          <div className="mt-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-emerald-800">
                <Lightbulb className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">Add Tip</span>
              </div>
              {selectedTip && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  {selectedTip}%
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[15, 18, 20, 22].map((tip) => {
                const tipAmount = parseFloat(baseAmount) * (tip / 100);
                return (
                  <button
                    key={tip}
                    type="button"
                    onClick={() => handleTipSelect(tip)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                      selectedTip === tip
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50"
                    }`}
                  >
                    <div className="font-bold text-sm">{tip}%</div>
                    <div className={`text-[10px] mt-0.5 ${selectedTip === tip ? "text-emerald-100" : "text-emerald-600"}`}>
                      ${tipAmount.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedTip && (
              <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800">Total with tip:</span>
                <span className="text-lg font-bold text-emerald-700">${formData.amount}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-zinc-700 mb-2">
          {t.category}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setFormData({ ...formData, category: cat });
                setSelectedTip(null);
                if (baseAmount) {
                  setFormData({ ...formData, category: cat, amount: baseAmount });
                }
              }}
              className={`px-4 py-3 rounded-xl font-medium text-sm transition-all border border-transparent ${
                formData.category === cat
                  ? "bg-zinc-900 text-white shadow-md"
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300"
              }`}
            >
              {translateCategory(cat, locale)}
            </button>
          ))}
        </div>
      </div>

      {/* Date/Time & Currency */}
      <div className="grid grid-cols-2 gap-4">
        {needsTime ? (
          <>
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
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 text-sm border-2 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
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
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 text-sm border-2 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                />
              </div>
            </div>
          </>
        ) : (
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
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full pl-10 pr-4 py-3 text-sm border-2 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            {t.currency}
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full pl-10 pr-4 py-3 text-sm border-2 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent appearance-none bg-white"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CNY">CNY</option>
              <option value="THB">THB</option>
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
            className="w-full pl-10 pr-4 py-3 text-sm border-2 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent placeholder:text-zinc-400"
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
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            rows={2}
            className="w-full pl-10 pr-4 py-3 text-sm border-2 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent placeholder:text-zinc-400 resize-none"
            placeholder="Add any details..."
          />
        </div>
      </div>

      {/* Category-Specific Fields */}
      <CategorySpecificFields
        category={formData.category}
        formData={formData}
        onChange={handleCategoryFieldChange}
      />

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
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Add Expense
            </>
          )}
        </button>
      </div>
    </form>
  );
}
