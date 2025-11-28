"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronRight,
  Camera,
  Upload,
  Calendar,
  CreditCard,
  Plane,
  Repeat,
  ScanLine,
  CloudOff,
  Check,
  Minus,
  Plus
} from "lucide-react";
import { createTransactionOffline } from "@/lib/use-offline-data";
import Image from "next/image";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  icon?: string;
  currency?: string;
}

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  trips?: Trip[];
  defaultTripId?: string;
}

// Simplified categories with emojis
const EXPENSE_CATEGORIES = [
  { name: "Food", icon: "🍔", gradient: "from-orange-400 to-red-500" },
  { name: "Transport", icon: "🚗", gradient: "from-blue-400 to-blue-600" },
  { name: "Shopping", icon: "🛍️", gradient: "from-pink-400 to-purple-500" },
  { name: "Entertainment", icon: "🎬", gradient: "from-purple-400 to-indigo-500" },
  { name: "Groceries", icon: "🛒", gradient: "from-green-400 to-emerald-500" },
  { name: "Bills", icon: "📱", gradient: "from-yellow-400 to-orange-500" },
  { name: "Health", icon: "💊", gradient: "from-cyan-400 to-blue-500" },
  { name: "Other", icon: "📦", gradient: "from-zinc-400 to-zinc-600" },
];

const INCOME_CATEGORIES = [
  { name: "Salary", icon: "💰", gradient: "from-emerald-400 to-green-600" },
  { name: "Freelance", icon: "💻", gradient: "from-blue-400 to-indigo-500" },
  { name: "Gift", icon: "🎁", gradient: "from-pink-400 to-rose-500" },
  { name: "Investment", icon: "📈", gradient: "from-violet-400 to-purple-600" },
  { name: "Refund", icon: "↩️", gradient: "from-cyan-400 to-teal-500" },
  { name: "Other", icon: "✨", gradient: "from-zinc-400 to-zinc-600" },
];

const CURRENCIES = [
  { code: "USD", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", flag: "🇬🇧" },
  { code: "JPY", symbol: "¥", flag: "🇯🇵" },
  { code: "CNY", symbol: "¥", flag: "🇨🇳" },
  { code: "THB", symbol: "฿", flag: "🇹🇭" },
  { code: "KRW", symbol: "₩", flag: "🇰🇷" },
  { code: "AUD", symbol: "A$", flag: "🇦🇺" },
];

export default function AddTransactionModal({
  isOpen,
  onClose,
  accounts,
  trips = [],
  defaultTripId,
}: AddTransactionModalProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState<"amount" | "details">("amount");
  const amountInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [note, setNote] = useState("");
  const [tripId, setTripId] = useState(defaultTripId || "");
  const [currency, setCurrency] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  // Receipt scanning
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);
  const [error, setError] = useState("");

  // Get current categories based on type
  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const selectedCategoryData = categories.find(c => c.name === category) || categories[0];

  // Get effective currency
  const effectiveCurrency = currency || accounts.find(a => a.id === accountId)?.currency || "USD";
  const currencySymbol = CURRENCIES.find(c => c.code === effectiveCurrency)?.symbol || "$";

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
      // Focus amount input after animation
      setTimeout(() => amountInputRef.current?.focus(), 300);
    } else {
      setIsVisible(false);
      document.body.style.overflow = "unset";
      // Reset form when closed
      resetForm();
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const resetForm = () => {
    setStep("amount");
    setType("expense");
    setAmount("");
    setCategory("Food");
    setDate(new Date().toISOString().split("T")[0]);
    setAccountId(accounts[0]?.id || "");
    setNote("");
    setTripId(defaultTripId || "");
    setCurrency("");
    setIsRecurring(false);
    setReceiptFile(null);
    setPreviewUrl(null);
    setError("");
    setSavedOffline(false);
  };

  const handleAmountChange = (value: string) => {
    // Allow only numbers and one decimal point
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setAmount(cleaned);
  };

  const handleQuickAmount = (value: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + value).toFixed(2));
  };

  const handleFileSelect = async (file: File) => {
    setReceiptFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
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
        if (data.amount) setAmount(data.amount.toString());
        if (data.category) setCategory(data.category);
        if (data.date) setDate(data.date);
        if (data.note) setNote(data.note);
      }
    } catch (err) {
      console.error("Receipt scan failed:", err);
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter an amount");
      return;
    }
    if (!accountId) {
      setError("Please select an account");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSavedOffline(false);

    try {
      let receiptUrl = null;

      if (receiptFile && navigator.onLine) {
        try {
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
        } catch (uploadError) {
          console.log("Receipt upload failed, continuing without receipt");
        }
      }

      const expenseDate = new Date(`${date}T12:00:00`);
      const finalAmount = parseFloat(amount);
      const signedAmount = type === "expense" ? -Math.abs(finalAmount) : Math.abs(finalAmount);
      const selectedAccount = accounts.find(a => a.id === accountId);
      const selectedTrip = trips.find(t => t.id === tripId);

      const transactionData = {
        accountId,
        amount: signedAmount,
        description: note || category,
        category,
        date: expenseDate.toISOString(),
        merchantName: note || null,
        receiptUrl,
        tripId: tripId || null,
        isTripRelated: !!tripId,
        isRecurring,
        currency: currency || null,
        location: null,
        tags: [],
        account: selectedAccount ? {
          id: selectedAccount.id,
          name: selectedAccount.name,
          type: selectedAccount.type,
          currency: selectedAccount.currency || "USD",
        } : undefined,
        trip: selectedTrip ? {
          id: selectedTrip.id,
          name: selectedTrip.name,
          destination: selectedTrip.destination,
        } : null,
      };

      const result = await createTransactionOffline(transactionData as any);

      if (result.success) {
        if (result.isOffline) {
          setSavedOffline(true);
          setTimeout(() => {
            onClose();
            router.refresh();
          }, 800);
        } else {
          onClose();
          router.refresh();
        }
      } else {
        setError("Failed to save transaction");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"
          }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full sm:max-w-md bg-white dark:bg-zinc-900 h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col transition-all duration-500 ease-out ${isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
          }`}
      >
        {/* Mobile Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
        </div>

        {/* Header with Type Toggle */}
        <div className="px-5 pb-4 pt-2 sm:pt-5 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {step === "amount" ? "New Transaction" : "Details"}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full text-zinc-500 dark:text-zinc-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Type Toggle */}
          <div className="p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex">
            <button
              onClick={() => {
                setType("expense");
                setCategory("Food");
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${type === "expense"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400"
                }`}
            >
              Expense
            </button>
            <button
              onClick={() => {
                setType("income");
                setCategory("Salary");
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${type === "income"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400"
                }`}
            >
              Income
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {step === "amount" ? (
            <div className="space-y-6">
              {/* Amount Input */}
              <div className="py-8 flex flex-col items-center">
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl font-medium text-zinc-400 dark:text-zinc-500 mr-1">
                    {currencySymbol}
                  </span>
                  <input
                    ref={amountInputRef}
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full max-w-[200px] text-center text-5xl font-bold text-zinc-900 dark:text-white bg-transparent border-none outline-none placeholder:text-zinc-200 dark:placeholder:text-zinc-700"
                    placeholder="0"
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex gap-2 mt-6">
                  {[5, 10, 20, 50].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAmount(val)}
                      className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full text-sm font-semibold transition-colors"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Grid */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3 px-1">
                  Category
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((cat) => {
                    const isSelected = category === cat.name;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setCategory(cat.name)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${isSelected
                            ? `bg-gradient-to-br ${cat.gradient} text-white shadow-lg scale-105`
                            : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                          }`}
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-[10px] font-bold truncate w-full text-center">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Receipt Scanner */}
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-3">
                {!receiptFile ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 rounded-xl font-semibold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Scan
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 rounded-xl font-semibold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-white dark:bg-zinc-700 p-2 rounded-xl">
                    <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-600 shrink-0">
                      {previewUrl && <Image src={previewUrl} alt="Receipt" fill className="object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">Receipt</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        {scanning ? (
                          <>
                            <ScanLine className="w-3 h-3 animate-pulse text-blue-500" />
                            <span className="text-blue-500">Scanning...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Ready</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptFile(null);
                        setPreviewUrl(null);
                      }}
                      className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-600 rounded-full text-zinc-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" />
                <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Note/Merchant */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Coffee at Starbucks..."
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white/20"
                />
              </div>

              {/* Date & Account Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    Account
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white/20"
                    >
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Trip Selector (for expenses) */}
              {type === "expense" && trips.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    Link to Trip (optional)
                  </label>
                  <div className="relative">
                    <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                    <select
                      value={tripId}
                      onChange={(e) => setTripId(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white/20"
                    >
                      <option value="">No trip</option>
                      {trips.map((trip) => (
                        <option key={trip.id} value={trip.id}>
                          {trip.name || trip.destination}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Currency Selector (if trip selected) */}
              {tripId && (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    Currency
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setCurrency("")}
                      className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${currency === ""
                          ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                        }`}
                    >
                      Auto
                    </button>
                    {CURRENCIES.map((curr) => (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={() => setCurrency(curr.code)}
                        className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${currency === curr.code
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                          }`}
                      >
                        <span>{curr.flag}</span>
                        <span>{curr.code}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recurring Toggle */}
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Repeat className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                  <div>
                    <div className="font-semibold text-sm text-zinc-900 dark:text-white">Recurring</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">Repeats monthly</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900 dark:peer-checked:bg-white"></div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-5 mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="p-5 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 shrink-0 space-y-3">
          {step === "amount" ? (
            <button
              onClick={() => {
                if (!amount || parseFloat(amount) <= 0) {
                  setError("Please enter an amount");
                  return;
                }
                setError("");
                setStep("details");
              }}
              disabled={!amount || parseFloat(amount) <= 0}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${selectedCategoryData.gradient} hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span>Continue</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("amount")}
                className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex-[2] py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${selectedCategoryData.gradient} hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : savedOffline ? (
                  <>
                    <CloudOff className="w-5 h-5" />
                    <span>Saved Offline!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Save {type === "expense" ? "Expense" : "Income"}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Offline indicator */}
          {typeof navigator !== "undefined" && !navigator.onLine && (
            <div className="flex items-center justify-center gap-2 text-zinc-400 dark:text-zinc-500 text-xs font-medium">
              <CloudOff className="w-3 h-3" />
              <span>Offline Mode • Syncs when online</span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
