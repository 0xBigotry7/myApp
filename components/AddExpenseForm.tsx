"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Camera, 
  Upload, 
  X, 
  Calendar, 
  CreditCard, 
  MapPin, 
  AlignLeft, 
  Repeat, 
  ChevronRight, 
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  Plane,
  ChevronDown,
  CloudOff,
  ScanLine,
  Receipt,
  Sparkles
} from "lucide-react";
import { createTransactionOffline } from "@/lib/use-offline-data";

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
  budgetCategories?: Array<{ category: string }>;
}

interface Suggestion {
  merchants: Array<{ name: string; count: number; lastAmount: number; category: string }>;
  categories: Array<{ name: string; count: number }>;
  commonAmounts: number[];
}

// General expense categories
const EXPENSE_CATEGORIES = [
  { name: "Groceries", icon: "🛒", color: "from-emerald-400 to-emerald-600", bg: "bg-emerald-50", text: "text-emerald-700" },
  { name: "Dining", icon: "🍽️", color: "from-orange-400 to-orange-600", bg: "bg-orange-50", text: "text-orange-700" },
  { name: "Transportation", icon: "🚗", color: "from-blue-400 to-blue-600", bg: "bg-blue-50", text: "text-blue-700" },
  { name: "Utilities", icon: "⚡", color: "from-yellow-400 to-yellow-600", bg: "bg-yellow-50", text: "text-yellow-700" },
  { name: "Rent/Mortgage", icon: "🏠", color: "from-rose-400 to-rose-600", bg: "bg-rose-50", text: "text-rose-700" },
  { name: "Entertainment", icon: "🎬", color: "from-pink-400 to-pink-600", bg: "bg-pink-50", text: "text-pink-700" },
  { name: "Shopping", icon: "🛍️", color: "from-purple-400 to-purple-600", bg: "bg-purple-50", text: "text-purple-700" },
  { name: "Healthcare", icon: "⚕️", color: "from-cyan-400 to-cyan-600", bg: "bg-cyan-50", text: "text-cyan-700" },
  { name: "Subscriptions", icon: "📱", color: "from-indigo-400 to-indigo-600", bg: "bg-indigo-50", text: "text-indigo-700" },
  { name: "Other", icon: "📦", color: "from-zinc-400 to-zinc-600", bg: "bg-zinc-50", text: "text-zinc-700" },
];

// Trip-specific expense categories
const TRIP_EXPENSE_CATEGORIES = [
  { name: "Transportation", icon: "✈️", color: "from-blue-400 to-blue-600", bg: "bg-blue-50", text: "text-blue-700" },
  { name: "Accommodation", icon: "🏨", color: "from-violet-400 to-violet-600", bg: "bg-violet-50", text: "text-violet-700" },
  { name: "Food", icon: "🍽️", color: "from-orange-400 to-orange-600", bg: "bg-orange-50", text: "text-orange-700" },
  { name: "Activities", icon: "🎫", color: "from-pink-400 to-pink-600", bg: "bg-pink-50", text: "text-pink-700" },
  { name: "Shopping", icon: "🛍️", color: "from-purple-400 to-purple-600", bg: "bg-purple-50", text: "text-purple-700" },
  { name: "Other", icon: "📦", color: "from-zinc-400 to-zinc-600", bg: "bg-zinc-50", text: "text-zinc-700" },
];

const INCOME_CATEGORIES = [
  { name: "Salary", icon: "💰", color: "from-emerald-400 to-emerald-600", bg: "bg-emerald-50", text: "text-emerald-700" },
  { name: "Freelance", icon: "👨‍💻", color: "from-blue-400 to-blue-600", bg: "bg-blue-50", text: "text-blue-700" },
  { name: "Gift", icon: "🎁", color: "from-pink-400 to-pink-600", bg: "bg-pink-50", text: "text-pink-700" },
  { name: "Investment", icon: "📈", color: "from-violet-400 to-violet-600", bg: "bg-violet-50", text: "text-violet-700" },
  { name: "Other", icon: "💎", color: "from-zinc-400 to-zinc-600", bg: "bg-zinc-50", text: "text-zinc-700" },
];

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "KRW", symbol: "₩", name: "Korean Won" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
];

interface AddExpenseFormProps {
  accounts: Account[];
  trips?: Trip[];
  defaultTripId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddExpenseForm({ accounts, trips = [], defaultTripId, onSuccess, onCancel }: AddExpenseFormProps) {
  const router = useRouter();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const merchantInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    amount: "",
    category: EXPENSE_CATEGORIES[0].name,
    merchantName: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    accountId: accounts.length > 0 ? accounts[0].id : "",
    isRecurring: false,
    type: "expense" as "expense" | "income",
    tripId: defaultTripId || "",
    currency: "", // Empty means use account currency
    location: "",
  });

  const [baseAmount, setBaseAmount] = useState("");
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [showMerchantSuggestions, setShowMerchantSuggestions] = useState(false);
  const [merchantInputFocused, setMerchantInputFocused] = useState(false);
  const [templates, setTemplates] = useState<Array<{
    id: string;
    name: string;
    merchantName: string;
    category: string;
    amount: number;
    accountId: string;
    usageCount: number;
  }>>([]);
  const [showTemplates, setShowTemplates] = useState(true);
  const [availableTrips, setAvailableTrips] = useState<Trip[]>(trips);
  const [showTripSelector, setShowTripSelector] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);

  // Fetch trips if not provided
  useEffect(() => {
    if (trips.length === 0) {
      fetch("/api/trips")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setAvailableTrips(data);
          }
        })
        .catch((err) => console.error("Failed to load trips:", err));
    }
  }, [trips]);

  // Fetch suggestions and templates on mount
  useEffect(() => {
    fetch("/api/expenses/suggestions")
      .then((res) => res.json())
      .then((data) => {
        setSuggestions(data);
        if (data.categories && data.categories.length > 0) {
          const mostUsedCategory = data.categories[0].name;
          const categoryExists = EXPENSE_CATEGORIES.find(c => c.name === mostUsedCategory);
          if (categoryExists && !formData.tripId) {
            setFormData((prev) => ({ ...prev, category: mostUsedCategory }));
          }
        }
      })
      .catch((err) => console.error("Failed to load suggestions:", err));

    fetch("/api/expenses/templates")
      .then((res) => res.json())
      .then((data) => {
        if (data.templates) {
          setTemplates(data.templates);
        }
      })
      .catch((err) => console.error("Failed to load templates:", err));
  }, []);

  // Check if category is food/restaurant related
  const isFoodCategory = formData.category.toLowerCase().includes("food") ||
                         formData.category.toLowerCase().includes("dining") ||
                         formData.category.toLowerCase().includes("restaurant");

  // Filter merchants based on input
  const filteredMerchants = suggestions?.merchants.filter((m) =>
    m.name.toLowerCase().includes(formData.merchantName.toLowerCase())
  ).slice(0, 5) || [];

  // Check if this is a trip expense
  const isTripExpense = !!formData.tripId;
  const selectedTrip = availableTrips.find(t => t.id === formData.tripId);

  // Active categories based on type and trip context
  const activeCategories = formData.type === "income" 
    ? INCOME_CATEGORIES 
    : isTripExpense 
      ? TRIP_EXPENSE_CATEGORIES 
      : EXPENSE_CATEGORIES;

  // Active categories definition needs to come before sortedCategories
  const sortedCategories = suggestions?.categories
    ? [...activeCategories].sort((a, b) => {
        const aCount = suggestions.categories.find((c) => c.name === a.name)?.count || 0;
        const bCount = suggestions.categories.find((c) => c.name === b.name)?.count || 0;
        return bCount - aCount;
      })
    : activeCategories;

  // Get currency symbol
  const getCurrencySymbol = (code: string) => {
    const currency = CURRENCIES.find(c => c.code === code);
    return currency?.symbol || "$";
  };

  // Effective currency (form currency or account currency)
  const effectiveCurrency = formData.currency || 
    accounts.find(a => a.id === formData.accountId)?.currency || 
    "USD";

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
    setSavedOffline(false);

    try {
      let receiptUrl = null;
      
      // Only try to upload receipt if online
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

      const expenseDate = new Date(`${formData.date}T12:00:00`);
      const finalAmount = parseFloat(formData.amount);
      const signedAmount = formData.type === "expense" ? -Math.abs(finalAmount) : Math.abs(finalAmount);

      const selectedAccount = accounts.find(a => a.id === formData.accountId);
      
      // Prepare transaction data
      const transactionData = {
        accountId: formData.accountId,
        amount: signedAmount,
        description: formData.description || formData.merchantName,
        category: formData.category,
        date: expenseDate.toISOString(),
        merchantName: formData.merchantName || null,
        receiptUrl,
        tripId: formData.tripId || null,
        isTripRelated: !!formData.tripId,
        isRecurring: formData.isRecurring,
        currency: formData.currency || null,
        location: formData.location || null,
        tags: [],
        account: selectedAccount ? {
          id: selectedAccount.id,
          name: selectedAccount.name,
          type: selectedAccount.type,
          currency: selectedAccount.currency || 'USD',
        } : undefined,
        trip: selectedTrip ? {
          id: selectedTrip.id,
          name: selectedTrip.name,
          destination: selectedTrip.destination,
        } : null,
      };

      // Try online first, fall back to offline
      const result = await createTransactionOffline(transactionData as any);
      
      if (result.success) {
        if (result.isOffline) {
          setSavedOffline(true);
          // Show a brief success message for offline save
          setTimeout(() => {
            if (onSuccess) {
              onSuccess();
            } else {
              router.push(formData.tripId ? `/trips/${formData.tripId}` : "/expenses");
              router.refresh();
            }
          }, 1000);
        } else {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(formData.tripId ? `/trips/${formData.tripId}` : "/expenses");
            router.refresh();
          }
        }
      } else {
        setError("Failed to add expense");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to add expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = activeCategories.find(c => c.name === formData.category) || activeCategories[0];

  const applyTemplate = (template: typeof templates[0]) => {
    setFormData({
      ...formData,
      merchantName: template.merchantName,
      category: template.category,
      amount: template.amount.toFixed(2),
      accountId: template.accountId || formData.accountId,
    });
  };

  return (
    <div className="pb-32 sm:pb-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Type Toggle - iOS Segmented Control Style */}
        <div className="mx-4 p-1 bg-zinc-100 rounded-full flex relative">
          <button
            type="button"
            onClick={() => {
              setFormData({ ...formData, type: "expense", category: isTripExpense ? TRIP_EXPENSE_CATEGORIES[0].name : EXPENSE_CATEGORIES[0].name });
              setSelectedTip(null);
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-full relative z-10 transition-colors ${
              formData.type === "expense" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({ ...formData, type: "income", category: INCOME_CATEGORIES[0].name, tripId: "" });
              setSelectedTip(null);
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-full relative z-10 transition-colors ${
              formData.type === "income" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Income
          </button>
          
          {/* Animated Background Pill */}
          <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
              formData.type === "income" ? "translate-x-[calc(100%+8px)]" : "translate-x-0"
            } left-1`} 
          />
        </div>

        {/* Amount Input - Hero Section */}
        <div className="px-6 py-2 flex flex-col items-center justify-center">
          <div className="flex items-baseline justify-center w-full relative">
            <span className="text-3xl font-medium text-zinc-400 mr-1 select-none self-center">
              {getCurrencySymbol(effectiveCurrency)}
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              required
              autoFocus
              value={isFoodCategory ? baseAmount : formData.amount}
              onChange={(e) =>
                isFoodCategory
                  ? handleBaseAmountChange(e.target.value)
                  : setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full max-w-[240px] text-center text-[4rem] leading-none font-bold text-zinc-900 bg-transparent border-none focus:ring-0 p-0 placeholder:text-zinc-200"
              placeholder="0"
            />
          </div>
          {isTripExpense && formData.currency && (
            <div className="mt-2 text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
              {formData.currency}
            </div>
          )}
        </div>

        {/* Quick Amount Chips */}
        {suggestions && suggestions.commonAmounts.length > 0 && !isFoodCategory && (
          <div className="flex flex-wrap justify-center gap-2 px-6">
            {suggestions.commonAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setFormData({ ...formData, amount: amt.toFixed(2) })}
                className="px-4 py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-full text-sm font-medium transition-colors border border-zinc-100"
              >
                ${amt.toFixed(0)}
              </button>
            ))}
          </div>
        )}

        {/* Quick Templates */}
        {templates.length > 0 && showTemplates && (
          <div className="pl-6">
            <div className="flex gap-3 overflow-x-auto pb-4 pr-6 snap-x no-scrollbar">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="snap-start flex-none w-36 p-3 bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md hover:border-zinc-200 transition-all text-left group relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 bg-zinc-50 rounded-lg text-zinc-500">
                      <Sparkles className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-zinc-900">${template.amount.toFixed(0)}</span>
                  </div>
                  <div className="font-medium text-sm text-zinc-800 truncate">
                    {template.merchantName}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                    {template.category}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Form Fields */}
        <div className="px-4 space-y-4">
          
          {/* Trip Selector (Conditional) */}
          {formData.type === "expense" && availableTrips.length > 0 && (
            <div className="relative z-20">
              <button
                type="button"
                onClick={() => setShowTripSelector(!showTripSelector)}
                className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                  isTripExpense 
                    ? "bg-purple-50/50 border-purple-100 hover:border-purple-200" 
                    : "bg-white border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isTripExpense ? "bg-purple-100 text-purple-600" : "bg-zinc-100 text-zinc-500"}`}>
                    <Plane className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className={`font-semibold text-sm ${isTripExpense ? "text-purple-900" : "text-zinc-900"}`}>
                      {isTripExpense ? (selectedTrip?.name || selectedTrip?.destination) : "General Expense"}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {isTripExpense ? "Linked to trip" : "Not linked to any trip"}
                    </div>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${showTripSelector ? "rotate-180" : ""}`} />
              </button>

              {/* Trip Dropdown */}
              {showTripSelector && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                   <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, tripId: "", category: EXPENSE_CATEGORIES[0].name, currency: "" });
                      setShowTripSelector(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-zinc-50 transition-colors flex items-center gap-3 border-b border-zinc-50"
                  >
                    <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900 text-sm">General Expense</div>
                      <div className="text-xs text-zinc-500">Not linked to any trip</div>
                    </div>
                  </button>
                  {availableTrips.map((trip) => (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => {
                        setFormData({ 
                          ...formData, 
                          tripId: trip.id, 
                          category: TRIP_EXPENSE_CATEGORIES[0].name,
                        });
                        setShowTripSelector(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-zinc-50 transition-colors flex items-center gap-3 border-b border-zinc-50 last:border-0 ${
                        formData.tripId === trip.id ? "bg-purple-50" : ""
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${formData.tripId === trip.id ? "bg-purple-100 text-purple-600" : "bg-zinc-100 text-zinc-500"}`}>
                        <Plane className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-900 text-sm">{trip.name || trip.destination}</div>
                        <div className="text-xs text-zinc-500">{trip.destination}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Category Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">Category</label>
            <div className="grid grid-cols-5 gap-2">
              {sortedCategories.map((cat) => {
                const isSelected = formData.category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, category: cat.name });
                      setSelectedTip(null);
                      if (baseAmount) setFormData({ ...formData, category: cat.name, amount: baseAmount });
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all duration-200 ${
                      isSelected
                        ? `bg-gradient-to-br ${cat.color} text-white shadow-lg shadow-zinc-200 scale-105 ring-2 ring-offset-2 ring-zinc-100`
                        : "bg-white border border-zinc-100 text-zinc-500 hover:border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <span className="text-2xl filter drop-shadow-sm">{cat.icon}</span>
                    <span className="text-[10px] font-bold truncate w-full text-center leading-tight">
                      {cat.name.split('/')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tip Calculator (Food only) */}
          {isFoodCategory && baseAmount && !isNaN(parseFloat(baseAmount)) && (
            <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100">
              <label className="block text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">Add Tip</label>
              <div className="flex gap-2">
                {[15, 18, 20].map((tip) => (
                  <button
                    key={tip}
                    type="button"
                    onClick={() => handleTipSelect(tip)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      selectedTip === tip
                        ? "bg-orange-500 text-white border-orange-600 shadow-md"
                        : "bg-white text-orange-600 border-orange-200 hover:bg-orange-50"
                    }`}
                  >
                    {tip}% <span className="opacity-80">(${(parseFloat(baseAmount) * (tip/100)).toFixed(0)})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Details Card */}
          <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
            {/* Merchant */}
            <div className="p-4 border-b border-zinc-100 relative">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Merchant</label>
              <div className="relative">
                <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300" />
                <input
                  ref={merchantInputRef}
                  type="text"
                  value={formData.merchantName}
                  onChange={(e) => {
                    setFormData({ ...formData, merchantName: e.target.value });
                    setShowMerchantSuggestions(true);
                  }}
                  onFocus={() => {
                    setMerchantInputFocused(true);
                    setShowMerchantSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowMerchantSuggestions(false), 200)}
                  className="w-full pl-8 py-1 bg-transparent border-none text-zinc-900 font-semibold placeholder:text-zinc-300 focus:ring-0 p-0 text-lg"
                  placeholder="Starbucks, Uber, etc."
                />
              </div>
              
              {/* Suggestions Dropdown */}
              {showMerchantSuggestions && filteredMerchants.length > 0 && (
                <div className="absolute left-0 right-0 top-full bg-white shadow-xl border-t border-zinc-100 z-20 max-h-48 overflow-y-auto">
                  {filteredMerchants.map((merchant) => (
                    <button
                      key={merchant.name}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          merchantName: merchant.name,
                          category: merchant.category || formData.category,
                          amount: merchant.lastAmount.toFixed(2),
                        });
                        setShowMerchantSuggestions(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-zinc-50 transition-colors flex items-center justify-between border-b border-zinc-50 last:border-0"
                    >
                      <div className="font-medium text-zinc-900">{merchant.name}</div>
                      <div className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">
                        {merchant.category}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Note */}
            <div className="p-4 border-b border-zinc-100">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Note</label>
              <div className="relative">
                <AlignLeft className="absolute left-0 top-3 w-5 h-5 text-zinc-300" />
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full pl-8 py-2 bg-transparent border-none text-sm font-medium text-zinc-900 placeholder:text-zinc-300 focus:ring-0 p-0 resize-none leading-relaxed"
                  placeholder="Add details..."
                />
              </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-2 divide-x divide-zinc-100">
              <div className="p-4">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full pl-6 py-1 bg-transparent border-none text-sm font-semibold text-zinc-900 focus:ring-0 p-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Account</label>
                <div className="relative">
                  <CreditCard className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 pointer-events-none" />
                  <select
                    required
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    className="w-full pl-6 py-1 bg-transparent border-none text-sm font-semibold text-zinc-900 focus:ring-0 p-0 cursor-pointer appearance-none truncate pr-4"
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Extended settings for Trips */}
              {isTripExpense && (
                <>
                  <div className="p-4 border-t border-zinc-100">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Currency</label>
                    <div className="relative">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 text-sm font-bold w-4 text-center">
                        {getCurrencySymbol(effectiveCurrency)}
                      </span>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full pl-6 py-1 bg-transparent border-none text-sm font-semibold text-zinc-900 focus:ring-0 p-0 cursor-pointer appearance-none"
                      >
                        <option value="">Auto ({accounts.find(a => a.id === formData.accountId)?.currency || 'USD'})</option>
                        {CURRENCIES.map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.code} ({curr.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-4 border-t border-zinc-100">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 pointer-events-none" />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full pl-6 py-1 bg-transparent border-none text-sm font-semibold text-zinc-900 placeholder:text-zinc-300 focus:ring-0 p-0"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Recurring Toggle */}
            <div className="p-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-600">Repeat Transaction</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                />
                <div className="w-10 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>
          </div>

          {/* Receipt Scanner */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-1.5">
            {!receiptFile ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 py-3 bg-zinc-50 border border-zinc-100 text-zinc-700 rounded-xl font-semibold text-xs hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Scan Receipt
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 bg-zinc-50 border border-zinc-100 text-zinc-700 rounded-xl font-semibold text-xs hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-white border border-zinc-100 flex-shrink-0">
                  {previewUrl && <Image src={previewUrl} alt="Receipt" fill className="object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-zinc-900 truncate">Receipt Attached</div>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                    {scanning ? (
                      <>
                        <ScanLine className="w-3 h-3 animate-pulse text-blue-500" />
                        <span className="text-blue-500 font-medium">Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Receipt className="w-3 h-3" />
                        <span>Ready to upload</span>
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
                  className="p-2 hover:bg-zinc-200 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Submit Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-zinc-100 sm:static sm:bg-transparent sm:border-0 sm:p-4 z-30">
          <button
            type="submit"
            disabled={isSubmitting || accounts.length === 0}
            className={`w-full py-4 rounded-[20px] font-bold text-lg text-white shadow-xl shadow-zinc-200 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2
              ${isSubmitting ? "bg-zinc-400 cursor-not-allowed" : `bg-gradient-to-r ${selectedCategory.color}`}`}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            ) : savedOffline ? (
              <>
                <CloudOff className="w-5 h-5" />
                <span>Saved Offline!</span>
              </>
            ) : (
              <>
                <span>Save Transaction</span>
                <ChevronRight className="w-5 h-5 opacity-80" />
              </>
            )}
          </button>
          
          {/* Offline indicator */}
          {typeof navigator !== 'undefined' && !navigator.onLine && (
            <div className="flex items-center justify-center gap-2 text-zinc-400 text-xs mt-3 font-medium">
              <CloudOff className="w-3 h-3" />
              <span>Offline Mode • Syncs when online</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
