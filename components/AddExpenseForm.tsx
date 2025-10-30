"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLocale } from "@/components/LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  icon?: string;
}

type Mode = "ai" | "manual";

const EXPENSE_CATEGORIES = [
  { name: "Groceries", icon: "🛒" },
  { name: "Dining", icon: "🍽️" },
  { name: "Transportation", icon: "🚗" },
  { name: "Utilities", icon: "💡" },
  { name: "Rent/Mortgage", icon: "🏠" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Healthcare", icon: "⚕️" },
  { name: "Subscriptions", icon: "📱" },
  { name: "Other", icon: "📦" },
];

export default function AddExpenseForm({ accounts }: { accounts: Account[] }) {
  const locale = useLocale();
  const t = getTranslations(locale);
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("ai");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    merchantName: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    accountId: accounts.length > 0 ? accounts[0].id : "",
    isRecurring: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = async (file: File) => {
    setReceiptFile(file);

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Scan with AI
    setScanning(true);
    setError("");

    try {
      const scanFormData = new FormData();
      scanFormData.append("file", file);

      const response = await fetch("/api/ai/scan-receipt", {
        method: "POST",
        body: scanFormData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          amount: data.amount?.toString() || prev.amount,
          category: data.category || prev.category,
          merchantName: data.location || prev.merchantName,
          description: data.note || prev.description,
          date: data.date || prev.date,
        }));
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to scan receipt");
      }
    } catch (err) {
      setError("Failed to scan receipt. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: -Math.abs(parseFloat(formData.amount)), // Negative for expenses
        }),
      });

      if (response.ok) {
        router.push("/expenses");
        router.refresh();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to add expense");
      }
    } catch (err) {
      setError("Failed to add expense. Please try again.");
    } finally {
      setIsSubmitting(false);
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
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
              : "bg-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <span className="text-2xl mr-2">✨</span>
          AI Scan
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`py-4 rounded-xl font-bold text-lg transition-all ${
            mode === "manual"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <span className="text-2xl mr-2">✍️</span>
          Manual
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
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8 rounded-3xl font-bold text-2xl hover:shadow-2xl transition-all transform active:scale-95 flex flex-col items-center justify-center gap-3"
                >
                  <span className="text-6xl">📸</span>
                  <span>Take Photo</span>
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
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 rounded-3xl font-bold text-2xl hover:shadow-2xl transition-all transform active:scale-95 flex flex-col items-center justify-center gap-3"
                >
                  <span className="text-6xl">🖼️</span>
                  <span>Choose Photo</span>
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

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 border-dashed rounded-2xl p-8 text-center">
                <div className="text-5xl mb-3">💡</div>
                <p className="text-gray-700 font-medium mb-2">
                  AI will read your receipt
                </p>
                <p className="text-sm text-gray-600">
                  Amount, category, and merchant will be auto-filled
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
                      Scanning receipt...
                    </p>
                  </div>
                )}
                {!scanning && (
                  <div className="flex items-center justify-center gap-3 py-4 bg-green-100 rounded-xl">
                    <span className="text-3xl">✓</span>
                    <p className="text-lg font-semibold text-green-700">
                      Scanned successfully!
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
                    category: "",
                    merchantName: "",
                    description: "",
                    date: new Date().toISOString().split("T")[0],
                    accountId: accounts.length > 0 ? accounts[0].id : "",
                    isRecurring: false,
                  });
                }}
                className="w-full py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                🔄 Scan Different Receipt
              </button>
            </>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Manual Mode or AI Results Form */}
      {(mode === "manual" || (mode === "ai" && receiptFile && !scanning)) && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              💵 Amount
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
                className="w-full pl-12 pr-6 py-5 text-3xl font-bold border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-400 focus:border-transparent transition-all placeholder:text-gray-300"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              🏷️ Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.name })}
                  className={`px-5 py-5 rounded-2xl font-semibold text-base transition-all touch-manipulation min-h-[60px] ${
                    formData.category === cat.name
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105"
                      : "bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-400 hover:bg-purple-50 active:scale-95"
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-xs">{cat.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Merchant Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              🏪 Merchant/Store
            </label>
            <input
              type="text"
              value={formData.merchantName}
              onChange={(e) =>
                setFormData({ ...formData, merchantName: e.target.value })
              }
              className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-400 focus:border-transparent transition-all placeholder:text-gray-400"
              placeholder="e.g., Starbucks, Amazon, Walmart"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              📝 Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-400 focus:border-transparent transition-all placeholder:text-gray-400 resize-none"
              placeholder="Add notes about this expense..."
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              📅 Date
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-4 py-4 text-base border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-400 focus:border-transparent transition-all"
            />
          </div>

          {/* Account */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              🏦 Account
            </label>
            {accounts.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                <p className="font-medium mb-2">No accounts found</p>
                <p className="text-xs">
                  Please add an account in the Finance page first.
                </p>
              </div>
            ) : (
              <select
                required
                value={formData.accountId}
                onChange={(e) =>
                  setFormData({ ...formData, accountId: e.target.value })
                }
                className="w-full px-4 py-4 text-base border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-400 focus:border-transparent transition-all appearance-none bg-white"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.75rem center",
                  backgroundSize: "1.25rem",
                }}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.icon} {account.name} (${account.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
            <input
              type="checkbox"
              id="recurring"
              checked={formData.isRecurring}
              onChange={(e) =>
                setFormData({ ...formData, isRecurring: e.target.checked })
              }
              className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="recurring" className="flex-1">
              <div className="font-semibold text-gray-900">Recurring Expense</div>
              <div className="text-xs text-gray-600">
                This expense repeats monthly (e.g., subscriptions, rent)
              </div>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={isSubmitting || accounts.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-5 rounded-2xl font-bold text-xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
            >
              {isSubmitting ? "💾 Saving..." : "✓ Save Expense"}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
