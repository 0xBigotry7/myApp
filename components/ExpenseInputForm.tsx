"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations, translateCategory } from "@/lib/i18n";
import { getSubcategoriesForCategory } from "@/lib/subcategories";

interface ExpenseInputFormProps {
  tripId: string;
  categories: string[];
}

type Mode = "ai" | "manual";

export default function ExpenseInputForm({
  tripId,
  categories,
}: ExpenseInputFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = getTranslations(locale);
  const [mode, setMode] = useState<Mode>("ai");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    amount: "",
    category: categories[0] || "",
    subcategory: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    currency: "USD",
    location: "",
    note: "",
  });

  // Determine date input type based on category
  const needsTime = ["Transportation", "Activities"].includes(formData.category);

  // Get subcategories for selected category
  const availableSubcategories = getSubcategoriesForCategory(formData.category);

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

      // Create expense
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripId,
          amount: parseFloat(formData.amount),
          category: formData.category,
          subcategory: formData.subcategory || undefined,
          date: formData.time
            ? new Date(`${formData.date}T${formData.time}:00`)
            : new Date(formData.date),
          currency: formData.currency,
          location: formData.location || undefined,
          note: formData.note || undefined,
          receiptUrl,
        }),
      });

      if (response.ok) {
        router.push(`/trips/${tripId}`);
        router.refresh();
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
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setMode("ai")}
          className={`py-4 rounded-xl font-bold text-lg transition-all ${
            mode === "ai"
              ? "bg-gradient-sunset-pink text-white shadow-lg"
              : "bg-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <span className="text-2xl mr-2">✨</span>
          {t.aiScan}
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`py-4 rounded-xl font-bold text-lg transition-all ${
            mode === "manual"
              ? "bg-gradient-blue-pink text-white shadow-lg"
              : "bg-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <span className="text-2xl mr-2">✍️</span>
          {t.manual}
        </button>
      </div>

      {/* AI Mode */}
      {mode === "ai" && (
        <div className="space-y-6">
          {!receiptFile ? (
            <>
              {/* Upload Options */}
              <div className="space-y-3">
                {/* Camera Capture */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full bg-gradient-sunset-pink text-white py-8 rounded-3xl font-bold text-2xl hover:shadow-2xl transition-all transform active:scale-95 flex flex-col items-center justify-center gap-3"
                >
                  <span className="text-6xl">📸</span>
                  <span>{t.takePhoto}</span>
                </button>
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

                {/* File Upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gradient-blue-pink text-white py-8 rounded-3xl font-bold text-2xl hover:shadow-2xl transition-all transform active:scale-95 flex flex-col items-center justify-center gap-3"
                >
                  <span className="text-6xl">🖼️</span>
                  <span>{t.choosePhoto}</span>
                </button>
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

              <div className="bg-gradient-to-br from-sunset-50 to-ocean-50 border-2 border-sunset-200 border-dashed rounded-2xl p-8 text-center">
                <div className="text-5xl mb-3">💡</div>
                <p className="text-gray-700 font-medium mb-2">
                  {t.aiWillRead}
                </p>
                <p className="text-sm text-gray-600">
                  {t.aiAmountCategory}
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Preview and Scanning Status */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border-2 border-gray-200">
                {previewUrl && (
                  <div className="relative w-full h-64 rounded-xl overflow-hidden mb-4">
                    <Image
                      src={previewUrl}
                      alt="Receipt preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                {scanning && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <div className="animate-spin text-4xl">🔄</div>
                    <p className="text-lg font-semibold text-gray-700">
                      {t.scanningReceipt}
                    </p>
                  </div>
                )}
                {!scanning && (
                  <div className="flex items-center justify-center gap-3 py-4 bg-green-100 rounded-xl">
                    <span className="text-3xl">✓</span>
                    <p className="text-lg font-semibold text-green-700">
                      {t.scannedSuccess}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setReceiptFile(null);
                  setPreviewUrl(null);
                  setFormData({
                    amount: "",
                    category: categories[0] || "",
                    date: new Date().toISOString().split("T")[0],
                    time: "",
                    currency: "USD",
                    location: "",
                    note: "",
                  });
                }}
                className="w-full py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                🔄 {t.scanDifferent}
              </button>
            </>
          )}
        </div>
      )}

      {/* Manual Mode or AI Results Form */}
      {(mode === "manual" || (mode === "ai" && receiptFile && !scanning)) && (
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
              {loading ? `💾 ${t.saving}` : `✓ ${t.saveExpense}`}
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
      )}
    </div>
  );
}
