"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  icon?: string;
}

const EXPENSE_CATEGORIES = [
  { name: "Groceries", icon: "🛒", color: "from-emerald-500 to-green-600" },
  { name: "Dining", icon: "🍽️", color: "from-orange-500 to-red-600" },
  { name: "Transportation", icon: "🚗", color: "from-blue-500 to-indigo-600" },
  { name: "Utilities", icon: "⚡", color: "from-yellow-500 to-orange-600" },
  { name: "Rent/Mortgage", icon: "🏠", color: "from-purple-500 to-pink-600" },
  { name: "Entertainment", icon: "🎬", color: "from-pink-500 to-rose-600" },
  { name: "Shopping", icon: "🛍️", color: "from-violet-500 to-purple-600" },
  { name: "Healthcare", icon: "⚕️", color: "from-red-500 to-pink-600" },
  { name: "Subscriptions", icon: "📱", color: "from-cyan-500 to-blue-600" },
  { name: "Other", icon: "💳", color: "from-slate-500 to-gray-600" },
];

export default function AddExpenseForm({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    amount: "",
    category: EXPENSE_CATEGORIES[0].name,
    merchantName: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    accountId: accounts.length > 0 ? accounts[0].id : "",
    isRecurring: false,
  });

  const [baseAmount, setBaseAmount] = useState("");
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Check if category is food/restaurant related
  const isFoodCategory = formData.category.toLowerCase().includes("food") ||
                         formData.category.toLowerCase().includes("dining") ||
                         formData.category.toLowerCase().includes("restaurant");

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
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

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
      let receiptUrl = null;

      if (receiptFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", receiptFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          receiptUrl = uploadData.url;
        }
      }

      // Fix timezone: use noon local time to avoid date shifts
      const expenseDate = new Date(`${formData.date}T12:00:00`);

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: formData.accountId,
          amount: -Math.abs(parseFloat(formData.amount)),
          description: formData.description || formData.merchantName,
          category: formData.category,
          date: expenseDate.toISOString(),
          merchantName: formData.merchantName || undefined,
          receiptUrl,
          isTripRelated: false,
          isRecurring: formData.isRecurring,
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

  const selectedCategory = EXPENSE_CATEGORIES.find(c => c.name === formData.category) || EXPENSE_CATEGORIES[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Receipt Scanner - Always visible at top */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-200/50">
        {!receiptFile ? (
          <div>
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">📸</div>
              <h3 className="font-bold text-gray-900 mb-1">Quick Scan</h3>
              <p className="text-xs text-gray-600">Scan a receipt to auto-fill details</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-2xl font-semibold text-sm hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="text-xl">📷</span>
                <span>Camera</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-2xl font-semibold text-sm hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="text-xl">🖼️</span>
                <span>Upload</span>
              </button>
            </div>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" />
          </div>
        ) : (
          <div>
            <div className="relative w-full h-32 rounded-2xl overflow-hidden mb-3 bg-white/50">
              {previewUrl && <Image src={previewUrl} alt="Receipt" fill className="object-contain" />}
            </div>
            {scanning ? (
              <div className="flex items-center justify-center gap-2 py-3 bg-white/70 rounded-xl">
                <div className="animate-spin text-2xl">⚙️</div>
                <p className="font-semibold text-indigo-700 text-sm">Scanning...</p>
              </div>
            ) : (
              <div className="flex items-center justify-between py-3 px-4 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  <p className="font-semibold text-emerald-700 text-sm">Scanned!</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null);
                    setPreviewUrl(null);
                  }}
                  className="text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 text-sm font-medium flex items-start gap-2">
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Amount Input - Large and prominent */}
      <div>
        <label className="block text-lg font-bold text-gray-900 mb-3">
          💵 {isFoodCategory ? "Subtotal (before tip)" : "Amount"}
        </label>
        <div className="relative">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-black text-gray-300">
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
            className="w-full pl-20 pr-8 py-6 text-5xl font-black border-3 border-gray-200 rounded-3xl text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white shadow-sm"
            placeholder="0.00"
          />
        </div>

        {/* Tip Calculator for Food/Dining Categories */}
        {isFoodCategory && baseAmount && !isNaN(parseFloat(baseAmount)) && (
          <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">💡 Quick Tip</span>
              {selectedTip && (
                <span className="text-xs font-semibold text-green-700 bg-green-200 px-3 py-1 rounded-full">
                  {selectedTip}% selected
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
                    className={`flex flex-col items-center justify-center p-3 rounded-xl font-bold transition-all active:scale-95 ${
                      selectedTip === tip
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg scale-105"
                        : "bg-white border-2 border-green-300 text-gray-700 hover:border-green-500 hover:bg-green-50"
                    }`}
                  >
                    <div className="text-lg">{tip}%</div>
                    <div className="text-xs mt-1">${tipAmount.toFixed(2)}</div>
                  </button>
                );
              })}
            </div>
            {selectedTip && (
              <div className="pt-2 border-t-2 border-green-300 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Total with tip:</span>
                <span className="text-2xl font-bold text-green-700">${formData.amount}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Selection - Compact grid */}
      <div>
        <label className="block text-lg font-bold text-gray-900 mb-3">🏷️ Category</label>
        <div className="grid grid-cols-5 gap-2">
          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => {
                setFormData({ ...formData, category: cat.name });
                // Reset tip calculation when changing category
                setSelectedTip(null);
                if (baseAmount) {
                  setFormData({ ...formData, category: cat.name, amount: baseAmount });
                }
              }}
              className={`relative aspect-square rounded-2xl transition-all duration-200 ${
                formData.category === cat.name
                  ? `bg-gradient-to-br ${cat.color} shadow-xl scale-105 ring-4 ring-offset-2 ring-gray-900/10`
                  : "bg-gray-100 hover:bg-gray-200 hover:scale-102 shadow-sm"
              }`}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl mb-0.5 transition-transform ${formData.category === cat.name ? "scale-110" : ""}`}>
                  {cat.icon}
                </span>
                <span className={`text-[0.6rem] font-bold leading-none px-1 text-center ${
                  formData.category === cat.name ? "text-white drop-shadow-sm" : "text-gray-700"
                }`}>
                  {cat.name.split('/')[0]}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Date and Account - Side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">📅 Date</label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-400 transition-all shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">🏦 Account</label>
          {accounts.length === 0 ? (
            <div className="px-4 py-3.5 bg-amber-50 border-2 border-amber-200 rounded-2xl text-xs text-amber-700 font-semibold">
              No accounts
            </div>
          ) : (
            <select
              required
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-400 transition-all appearance-none shadow-sm"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.75rem center",
                backgroundSize: "1rem",
              }}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Merchant and Description */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">🏪 Merchant</label>
        <input
          type="text"
          value={formData.merchantName}
          onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
          className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-base font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-400 transition-all shadow-sm"
          placeholder="Where did you spend?"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">📝 Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-base font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-400 transition-all resize-none shadow-sm"
          placeholder="Add a note (optional)"
        />
      </div>

      {/* Recurring Checkbox */}
      <label className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border-2 border-blue-200 cursor-pointer hover:border-blue-300 hover:bg-blue-100 transition-all">
        <input
          type="checkbox"
          checked={formData.isRecurring}
          onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
          className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex-1">
          <div className="font-bold text-sm text-gray-900">🔄 Recurring Expense</div>
          <div className="text-xs text-gray-600">Repeats monthly (subscriptions, bills, etc.)</div>
        </div>
      </label>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all shadow-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || accounts.length === 0}
          className={`flex-2 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${selectedCategory.color} text-white min-w-[60%]`}
        >
          {isSubmitting ? "💾 Saving..." : "✓ Add Expense"}
        </button>
      </div>
    </form>
  );
}
