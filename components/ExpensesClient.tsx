"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";
import { format, isSameMonth, isToday, isYesterday, startOfMonth, endOfMonth } from "date-fns";
import Link from "next/link";
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  Calendar, 
  Filter, 
  Plane, 
  Home, 
  Search, 
  CreditCard,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  MoreHorizontal,
  Repeat
} from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import AddTransactionModal from "./AddTransactionModal";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  icon?: string;
  color?: string;
}

interface Transaction {
  id: string;
  amount: number;
  category: string;
  merchantName?: string;
  description?: string;
  date: string;
  account: Account;
  receiptUrl?: string;
  isRecurring: boolean;
  isTripRelated: boolean;
  tripId?: string | null;
  location?: string | null;
  currency?: string | null;
  trip?: {
    id: string;
    name: string;
    destination: string;
  } | null;
}

interface Expense {
  id: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  note?: string | null;
  location?: string | null;
  tripId: string;
}

interface BudgetEnvelope {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  rollover: number;
  icon?: string;
  color?: string;
}

interface Budget {
  id: string;
  month: number;
  year: number;
  totalIncome: number;
  totalAllocated: number;
  envelopes: BudgetEnvelope[];
}

interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: string;
  nextDate: string;
  merchantName?: string;
}

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

interface ExpensesClientProps {
  budget: Budget | null;
  accounts: Account[];
  transactions: Transaction[];
  expenses: Expense[];
  recurringTransactions: RecurringTransaction[];
  trips: Trip[];
  currentMonth: number;
  currentYear: number;
}

// Currency conversion rates to USD (matching Trip page logic)
const conversionRates: Record<string, number> = {
  USD: 1,
  EUR: 1.09,
  GBP: 1.27,
  JPY: 0.0067,
  CNY: 0.138,
  THB: 0.029,
  AUD: 0.66,
  CAD: 0.73,
  CHF: 1.13,
  HKD: 0.13,
  SGD: 0.74,
  KRW: 0.00075,
  MXN: 0.059,
  INR: 0.012,
};

const convertToUSD = (amount: number, currency: string): number => {
  const rate = conversionRates[currency] || 1;
  return amount * rate;
};

const getCurrencySymbol = (currency: string) => {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CNY: "¥",
    THB: "฿",
  };
  return symbols[currency] || currency;
};

const EXPENSE_CATEGORIES = [
  { name: "Groceries", icon: "🛒", color: "bg-emerald-100 text-emerald-700" },
  { name: "Dining", icon: "🍽️", color: "bg-orange-100 text-orange-700" },
  { name: "Transportation", icon: "🚗", color: "bg-blue-100 text-blue-700" },
  { name: "Utilities", icon: "⚡", color: "bg-yellow-100 text-yellow-700" },
  { name: "Rent/Mortgage", icon: "🏠", color: "bg-rose-100 text-rose-700" },
  { name: "Entertainment", icon: "🎬", color: "bg-pink-100 text-pink-700" },
  { name: "Shopping", icon: "🛍️", color: "bg-purple-100 text-purple-700" },
  { name: "Healthcare", icon: "⚕️", color: "bg-cyan-100 text-cyan-700" },
  { name: "Subscriptions", icon: "📱", color: "bg-indigo-100 text-indigo-700" },
  { name: "Travel", icon: "✈️", color: "bg-sky-100 text-sky-700" },
  { name: "Accommodation", icon: "🏨", color: "bg-violet-100 text-violet-700" },
  { name: "Activities", icon: "🎫", color: "bg-rose-100 text-rose-700" },
  { name: "Other", icon: "📦", color: "bg-zinc-100 text-zinc-700" },
];

interface UnifiedExpenseItem {
  id: string;
  date: Date;
  amount: number; // In USD (converted)
  originalAmount: number;
  originalCurrency: string;
  category: string;
  description: string;
  type: "transaction" | "expense";
  tripId?: string | null;
  location?: string | null;
  accountName?: string;
  isIncome?: boolean;
  tripName?: string;
}

export default function ExpensesClient({
  budget,
  accounts,
  transactions,
  expenses,
  recurringTransactions,
  trips,
  currentMonth,
  currentYear,
}: ExpensesClientProps) {
  const locale = useLocale();
  const t = getTranslations(locale);
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "trip" | "general">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [amountRange, setAmountRange] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const now = new Date();
  const daysPassed = now.getDate();

  // Merge and normalize data
  const unifiedItems: UnifiedExpenseItem[] = useMemo(() => {
    const txItems: UnifiedExpenseItem[] = transactions.map(t => {
      const currency = t.currency || t.account.currency;
      return {
        id: t.id,
        date: new Date(t.date),
        amount: convertToUSD(Math.abs(t.amount), currency),
        originalAmount: Math.abs(t.amount),
        originalCurrency: currency,
        category: t.category,
        description: t.merchantName || t.description || t.category,
        type: "transaction" as const,
        tripId: t.tripId,
        location: t.location || t.trip?.destination,
        accountName: t.account.name,
        isIncome: t.amount > 0,
        tripName: t.trip?.name || t.trip?.destination,
      };
    });

    // Legacy expenses
    const expItems: UnifiedExpenseItem[] = expenses.map(e => ({
      id: e.id,
      date: new Date(e.date),
      amount: convertToUSD(e.amount, e.currency),
      originalAmount: e.amount,
      originalCurrency: e.currency,
      category: e.category,
      description: e.note || e.category,
      type: "expense" as const,
      tripId: e.tripId,
      location: e.location,
      isIncome: false,
    }));

    return [...txItems, ...expItems].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, expenses]);

  // Filter items
  const filteredItems = useMemo(() => {
    return unifiedItems.filter(item => {
      const isTrip = item.type === "expense" || (item.type === "transaction" && !!item.tripId);
      
      const matchesFilter = 
        filter === "all" ? true :
        filter === "trip" ? isTrip :
        !isTrip;
      
      const matchesSearch = searchQuery ? (
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchQuery.toLowerCase())
      ) : true;

      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;

      const matchesAmountRange = 
        (amountRange.min === "" || item.amount >= parseFloat(amountRange.min)) &&
        (amountRange.max === "" || item.amount <= parseFloat(amountRange.max));

      const matchesDateRange = 
        (dateRange.start === "" || item.date >= new Date(dateRange.start)) &&
        (dateRange.end === "" || item.date <= new Date(dateRange.end));

      return matchesFilter && matchesSearch && matchesCategory && matchesAmountRange && matchesDateRange;
    });
  }, [unifiedItems, filter, searchQuery, selectedCategory, amountRange, dateRange]);

  // Calculate stats for CURRENT MONTH
  const monthlyStats = useMemo(() => {
    const currentMonthItems = unifiedItems.filter(item => 
      isSameMonth(item.date, now)
    );

    const totalSpent = currentMonthItems
      .filter(item => !item.isIncome)
      .reduce((sum, item) => sum + item.amount, 0);
      
    const totalIncome = currentMonthItems
      .filter(item => item.isIncome)
      .reduce((sum, item) => sum + item.amount, 0);

    const dailyAverage = daysPassed > 0 ? totalSpent / daysPassed : 0;
    
    const tripSpent = currentMonthItems
      .filter(item => (item.type === "expense" || !!item.tripId) && !item.isIncome)
      .reduce((sum, item) => sum + item.amount, 0);

    return { totalSpent, totalIncome, dailyAverage, tripSpent };
  }, [unifiedItems, daysPassed, now]);

  // Calculate total balance (converted to USD)
  const totalBalanceUSD = useMemo(() => {
    return accounts.reduce((sum, account) => {
      const amount = convertToUSD(account.balance, account.currency);
      if (account.type === "credit_card" || account.type === "loan" || account.type === "debt") {
        return sum - amount;
      }
      return sum + amount;
    }, 0);
  }, [accounts]);

  // Group by date (Today, Yesterday, etc.)
  const groupedItems = useMemo(() => {
    const groups: Record<string, UnifiedExpenseItem[]> = {};
    filteredItems.forEach(item => {
      const dateKey = format(item.date, "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Calculate category breakdown for current month
  const categoryBreakdown = useMemo(() => {
    const currentMonthItems = unifiedItems.filter(item => 
      isSameMonth(item.date, now) && !item.isIncome
    );

    const categoryMap = new Map<string, number>();
    currentMonthItems.forEach(item => {
      const existing = categoryMap.get(item.category) || 0;
      categoryMap.set(item.category, existing + item.amount);
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value: Math.abs(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [unifiedItems, now]);

  const COLORS = [
    "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", 
    "#3B82F6", "#EF4444", "#06B6D4", "#6366F1"
  ];

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMM d");
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Expenses</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2 font-medium">
            <Calendar className="w-4 h-4" />
            {format(now, "MMMM yyyy")}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all font-bold shadow-lg shadow-zinc-200 dark:shadow-zinc-900 active:scale-95 hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>Add Transaction</span>
        </button>
      </div>

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        accounts={accounts}
        trips={trips}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
              <TrendingUp className="w-5 h-5 text-zinc-900 dark:text-white" />
            </div>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">This Month</span>
          </div>
          <div className="text-3xl font-black text-zinc-900 dark:text-white mb-1 tracking-tight">
            ${monthlyStats.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Total Spent</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Daily Avg</span>
          </div>
          <div className="text-3xl font-black text-zinc-900 dark:text-white mb-1 tracking-tight">
            ${monthlyStats.dailyAverage.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Per Day</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-2xl">
              <Plane className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Travel</span>
          </div>
          <div className="text-3xl font-black text-zinc-900 dark:text-white mb-1 tracking-tight">
            ${monthlyStats.tripSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">On Trips</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl">
              <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Net Worth</span>
          </div>
          <div className="text-3xl font-black text-zinc-900 dark:text-white mb-1 tracking-tight">
            ${totalBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Total Balance</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-3 sticky top-24 z-10 backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80">
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
              <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setFilter("all")}
                  className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    filter === "all" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("general")}
                  className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    filter === "general" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  General
                </button>
                <button
                  onClick={() => setFilter("trip")}
                  className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    filter === "trip" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  Trips
                </button>
              </div>

              <div className="flex gap-2 w-full sm:w-auto pl-2 pr-2 sm:pl-0 sm:pr-2">
                <div className="relative flex-1 sm:w-64 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-300 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-700 border focus:border-zinc-200 dark:focus:border-zinc-600 rounded-xl text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    showFilters || selectedCategory || amountRange.min || amountRange.max || dateRange.start || dateRange.end
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl font-medium text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700"
                  >
                    <option value="">All Categories</option>
                    {Array.from(new Set(unifiedItems.map(item => item.category))).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">Min Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountRange.min}
                    onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">Max Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountRange.max}
                    onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                    placeholder="∞"
                    className="w-full px-3 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-end h-full">
                    <button
                      onClick={() => {
                        setSelectedCategory("");
                        setAmountRange({ min: "", max: "" });
                        setDateRange({ start: "", end: "" });
                      }}
                      className="w-full px-4 py-2.5 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transactions */}
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([dateKey, items]) => (
              <div key={dateKey} className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider pl-2">
                  {getDateLabel(dateKey)}
                </h3>
                <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden divide-y divide-zinc-50/50 dark:divide-zinc-800">
                  {items.map((item, i) => {
                    const categoryInfo = EXPENSE_CATEGORIES.find(c => c.name === item.category);
                    const trip = item.tripId ? trips.find(t => t.id === item.tripId) : null;
                    const isTrip = item.type === "expense" || !!trip;

                    return (
                      <div 
                        key={item.id} 
                        className="group p-4 flex items-center gap-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-all cursor-default"
                      >
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl shadow-sm ${categoryInfo?.color || "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                          {categoryInfo?.icon || "📦"}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-zinc-900 dark:text-white truncate text-[15px]">
                              {item.description}
                            </h4>
                            <div className="text-right">
                              <div className={`font-bold text-[15px] ${item.isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-white"}`}>
                                {item.isIncome ? "+" : ""}{getCurrencySymbol(item.originalCurrency)}{item.originalAmount.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                              <span className="capitalize">{item.category}</span>
                              {isTrip ? (
                                <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <Plane className="w-3 h-3" />
                                  {trip?.destination || item.location || "Trip"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <Home className="w-3 h-3" />
                                  Personal
                                </span>
                              )}
                              {item.accountName && (
                                <>
                                  <span className="text-zinc-300 dark:text-zinc-600">•</span>
                                  <span>{item.accountName}</span>
                                </>
                              )}
                            </div>
                            {item.originalCurrency !== "USD" && (
                              <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                                ~${item.amount.toFixed(2)} USD
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {Object.keys(groupedItems).length === 0 && (
               <div className="text-center py-24">
                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Filter className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No transactions found</h3>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">Try adjusting filters or search to find what you're looking for.</p>
               </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Accounts */}
          <div className="bg-zinc-900 dark:bg-zinc-800 text-white p-6 rounded-[24px] shadow-xl">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-zinc-400" /> Your Accounts
            </h2>
            <div className="space-y-3">
              {accounts.map(account => (
                <div key={account.id} className="flex justify-between items-center p-3.5 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer border border-white/5 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                      {account.type === "checking" ? "🏦" : account.type === "credit_card" ? "💳" : "💰"}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{account.name}</div>
                      <div className="text-xs text-zinc-400 capitalize">{account.type.replace("_", " ")}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">
                      {getCurrencySymbol(account.currency)}{account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {account.currency !== "USD" && (
                      <div className="text-[10px] text-zinc-500">
                        ~${convertToUSD(account.balance, account.currency).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 bg-white text-zinc-900 rounded-xl text-sm font-bold hover:bg-zinc-100 transition-colors">
              Manage Accounts
            </button>
          </div>

          {/* Category Breakdown Chart */}
          {categoryBreakdown.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-zinc-400 dark:text-zinc-500" /> Top Categories
              </h2>
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {categoryBreakdown.slice(0, 5).map((cat, idx) => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{cat.name}</span>
                    </div>
                    <span className="text-zinc-900 dark:text-white font-bold">${cat.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring */}
          {recurringTransactions.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                 <Calendar className="w-5 h-5 text-zinc-400 dark:text-zinc-500" /> Upcoming
              </h2>
              <div className="space-y-4">
                {recurringTransactions.slice(0, 3).map(rec => (
                  <div key={rec.id} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <Repeat className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{rec.name}</span>
                    </div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">${rec.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
