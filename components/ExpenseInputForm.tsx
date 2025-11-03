"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations, translateCategory } from "@/lib/i18n";

interface ExpenseInputFormProps {
  tripId: string;
  categories: string[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ExpenseInputForm({
  tripId,
  categories,
  onSuccess,
  onCancel,
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
    location: "",
    note: "",
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
      {/* AI Receipt Scanner - Optional feature at top */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4 border border-violet-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">AI Receipt Scan</h3>
              <p className="text-xs text-gray-600">Auto-fill from photo</p>
            </div>
          </div>
          {receiptFile && (
            <button
              type="button"
              onClick={() => {
                setReceiptFile(null);
                setPreviewUrl(null);
              }}
              className="text-xs font-semibold text-violet-600 hover:text-violet-800"
            >
              Remove
            </button>
          )}
        </div>

        {!receiptFile ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center gap-1 py-3 bg-white rounded-xl border-2 border-violet-200 hover:border-violet-400 hover:bg-violet-50 transition-all"
            >
              <span className="text-2xl">📷</span>
              <span className="text-xs font-semibold text-gray-700">Camera</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1 py-3 bg-white rounded-xl border-2 border-violet-200 hover:border-violet-400 hover:bg-violet-50 transition-all"
            >
              <span className="text-2xl">🖼️</span>
              <span className="text-xs font-semibold text-gray-700">Upload</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {previewUrl && (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-violet-200">
                <Image
                  src={previewUrl}
                  alt="Receipt"
                  fill
                  className="object-contain bg-white"
                />
              </div>
            )}
            {scanning ? (
              <div className="flex items-center justify-center gap-2 py-2 bg-violet-100 rounded-lg">
                <div className="animate-spin text-xl">⚙️</div>
                <span className="text-sm font-semibold text-violet-700">Scanning...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2 bg-emerald-100 rounded-lg">
                <span className="text-xl">✓</span>
                <span className="text-sm font-semibold text-emerald-700">Scanned successfully</span>
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {isFoodCategory ? "💵 Subtotal (before tip)" : "💵 Amount"}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">
            $
          </span>
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
            className="w-full pl-10 pr-4 py-4 text-3xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder:text-gray-300"
            placeholder="0.00"
          />
        </div>

        {/* Tip Calculator */}
        {isFoodCategory && baseAmount && !isNaN(parseFloat(baseAmount)) && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700">💡 Add Tip</span>
              {selectedTip && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-200 px-2 py-0.5 rounded-full">
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
                    className={`flex flex-col items-center justify-center p-2 rounded-lg font-bold transition-all text-sm ${
                      selectedTip === tip
                        ? "bg-emerald-500 text-white shadow-md"
                        : "bg-white border border-emerald-300 text-gray-700 hover:border-emerald-500"
                    }`}
                  >
                    <div>{tip}%</div>
                    <div className="text-xs mt-0.5">${tipAmount.toFixed(2)}</div>
                  </button>
                );
              })}
            </div>
            {selectedTip && (
              <div className="mt-2 pt-2 border-t border-emerald-300 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Total:</span>
                <span className="text-xl font-bold text-emerald-700">${formData.amount}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          🏷️ Category
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
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                formData.category === cat
                  ? "bg-violet-500 text-white shadow-md"
                  : "bg-white border-2 border-gray-200 text-gray-700 hover:border-violet-300"
              }`}
            >
              {translateCategory(cat, locale)}
            </button>
          ))}
        </div>
      </div>

      {/* Date/Time & Currency */}
      <div className="grid grid-cols-2 gap-3">
        {needsTime ? (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📅 Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🕐 Time <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Date
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            💱 Currency
          </label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none bg-white"
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📍 Location <span className="text-gray-400 font-normal text-xs">(optional)</span>
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-gray-400"
          placeholder="e.g., Starbucks, Times Square"
        />
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📝 Note <span className="text-gray-400 font-normal text-xs">(optional)</span>
        </label>
        <textarea
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          rows={2}
          className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-gray-400 resize-none"
          placeholder="Add any details..."
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => onCancel ? onCancel() : router.back()}
          className="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "💾 Saving..." : "✓ Add Expense"}
        </button>
      </div>
    </form>
  );
}
