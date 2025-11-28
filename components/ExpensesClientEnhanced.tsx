"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, isSameMonth, isToday, isYesterday, startOfMonth, endOfMonth, subMonths } from "date-fns";
import Link from "next/link";
import { 
  Plus, 
  Wallet, 
  TrendingUp,
  TrendingDown, 
  Calendar, 
  Filter, 
  Plane, 
  Home, 
  Search, 
  CreditCard,
  PieChart,
  ChevronRight,
  ChevronLeft,
  List,
  Bell,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Trash2,
  MoreHorizontal,
  X,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Eye,
  Tag,
} from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis } from "recharts";
import AddTransactionModal from "./AddTransactionModal";
import BudgetManager from "./BudgetManager";
import SpendingTrends from "./SpendingTrends";
import SubscriptionsView from "./SubscriptionsView";
import EditTransactionModal from "./EditTransactionModal";

// ============================================================================
// TYPES
// ============================================================================

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
  accountId: string;
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
  isActive: boolean;
}

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

interface ExpensesClientEnhancedProps {
  budget: Budget | null;
  accounts: Account[];
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  trips: Trip[];
  currentMonth: number;
  currentYear: number;
}

// ============================================================================
// CONSTANTS & CONFIG
// ============================================================================

const CURRENCY_RATES: Record<string, number> = {
  USD: 1, EUR: 1.09, GBP: 1.27, JPY: 0.0067, CNY: 0.138, THB: 0.029,
  AUD: 0.66, CAD: 0.73, CHF: 1.13, HKD: 0.13, SGD: 0.74, KRW: 0.00075,
  MXN: 0.059, INR: 0.012, VND: 0.00004, NZD: 0.61, SEK: 0.095,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥", THB: "฿",
  KRW: "₩", INR: "₹", VND: "₫", CHF: "Fr",
};

const CATEGORIES = {
  Groceries: { icon: "🛒", gradient: "from-emerald-500 to-teal-600", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  Dining: { icon: "🍽️", gradient: "from-orange-500 to-amber-600", bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200" },
  Transportation: { icon: "🚗", gradient: "from-blue-500 to-indigo-600", bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200" },
  Utilities: { icon: "⚡", gradient: "from-yellow-500 to-orange-500", bg: "bg-yellow-50", text: "text-yellow-700", ring: "ring-yellow-200" },
  "Rent/Mortgage": { icon: "🏠", gradient: "from-rose-500 to-pink-600", bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
  Entertainment: { icon: "🎬", gradient: "from-pink-500 to-rose-600", bg: "bg-pink-50", text: "text-pink-700", ring: "ring-pink-200" },
  Shopping: { icon: "🛍️", gradient: "from-purple-500 to-violet-600", bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-200" },
  Healthcare: { icon: "⚕️", gradient: "from-cyan-500 to-blue-600", bg: "bg-cyan-50", text: "text-cyan-700", ring: "ring-cyan-200" },
  Subscriptions: { icon: "📱", gradient: "from-indigo-500 to-purple-600", bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200" },
  Travel: { icon: "✈️", gradient: "from-sky-500 to-blue-600", bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
  Accommodation: { icon: "🏨", gradient: "from-violet-500 to-purple-600", bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200" },
  Activities: { icon: "🎫", gradient: "from-fuchsia-500 to-pink-600", bg: "bg-fuchsia-50", text: "text-fuchsia-700", ring: "ring-fuchsia-200" },
  Food: { icon: "🍜", gradient: "from-amber-500 to-orange-600", bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  Salary: { icon: "💰", gradient: "from-emerald-500 to-green-600", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  Freelance: { icon: "💻", gradient: "from-blue-500 to-cyan-600", bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200" },
  Investment: { icon: "📈", gradient: "from-violet-500 to-indigo-600", bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200" },
  Gift: { icon: "🎁", gradient: "from-pink-500 to-rose-600", bg: "bg-pink-50", text: "text-pink-700", ring: "ring-pink-200" },
  Other: { icon: "📦", gradient: "from-zinc-500 to-slate-600", bg: "bg-zinc-100", text: "text-zinc-700", ring: "ring-zinc-200" },
};

const CHART_COLORS = ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#06B6D4", "#6366F1"];

type ViewMode = "transactions" | "budget" | "trends" | "bills";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const toUSD = (amount: number, currency: string): number => amount * (CURRENCY_RATES[currency] || 1);
const getSymbol = (currency: string) => CURRENCY_SYMBOLS[currency] || currency;
const getCategory = (name: string) => CATEGORIES[name as keyof typeof CATEGORIES] || CATEGORIES.Other;

const formatCurrency = (amount: number, currency: string = "USD", compact: boolean = false) => {
  const symbol = getSymbol(currency);
  if (compact && Math.abs(amount) >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}k`;
  }
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  trend,
  color = "zinc",
  className = "",
}: {
  icon: any;
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: number; positive: boolean };
  color?: string;
  className?: string;
}) => {
  const colorClasses: Record<string, { bg: string; icon: string }> = {
    zinc: { bg: "bg-zinc-100 dark:bg-zinc-800", icon: "text-zinc-700 dark:text-zinc-300" },
    blue: { bg: "bg-blue-50 dark:bg-blue-950/30", icon: "text-blue-600 dark:text-blue-400" },
    purple: { bg: "bg-purple-50 dark:bg-purple-950/30", icon: "text-purple-600 dark:text-purple-400" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: "text-emerald-600 dark:text-emerald-400" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/30", icon: "text-amber-600 dark:text-amber-400" },
  };
  const colors = colorClasses[color] || colorClasses.zinc;

  return (
    <div className={`group relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 hover:shadow-lg hover:shadow-zinc-100/50 dark:hover:shadow-zinc-900/50 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all duration-300 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${colors.bg} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
            trend.positive ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
          }`}>
            {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight mb-0.5">{value}</div>
      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{label}</div>
      {subValue && <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{subValue}</div>}
    </div>
  );
};

const TransactionRow = ({
  transaction,
  trips,
  onEdit,
  onDelete,
}: {
  transaction: Transaction & { amountUSD: number; originalAmount: number; originalCurrency: string; isIncome: boolean };
  trips: Trip[];
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const [showActions, setShowActions] = useState(false);
  const category = getCategory(transaction.category);
  const trip = transaction.tripId ? trips.find(t => t.id === transaction.tripId) : null;
  
  return (
    <div 
      className="group relative flex items-center gap-4 p-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-all duration-200 rounded-xl mx-2 my-1"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Category Icon */}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${category.bg} ${category.text} shadow-sm transition-transform duration-200 group-hover:scale-105`}>
        {category.icon}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="font-semibold text-zinc-900 dark:text-white truncate">
            {transaction.merchantName || transaction.description || transaction.category}
          </h4>
          {transaction.receiptUrl && (
            <Receipt className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${category.bg} ${category.text}`}>
            {transaction.category}
          </span>
          {trip ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400">
              <Plane className="w-3 h-3" />
              {trip.name || trip.destination}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              <Home className="w-3 h-3" />
              Personal
            </span>
          )}
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {transaction.account.name}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <div className={`text-base font-bold ${transaction.isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-white"}`}>
          {transaction.isIncome ? "+" : "-"}{formatCurrency(transaction.originalAmount, transaction.originalCurrency)}
        </div>
        {transaction.originalCurrency !== "USD" && (
          <div className="text-xs text-zinc-400 dark:text-zinc-500">
            ≈ ${transaction.amountUSD.toFixed(2)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={`flex items-center gap-1 transition-all duration-200 ${showActions ? "opacity-100" : "opacity-0"}`}>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-2 rounded-lg hover:bg-zinc-200/80 dark:hover:bg-zinc-700 transition-colors"
        >
          <Edit3 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group/delete"
        >
          <Trash2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover/delete:text-red-500" />
        </button>
      </div>
    </div>
  );
};

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description,
  action,
}: {
  icon: any;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
    <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 text-zinc-400 dark:text-zinc-500" />
    </div>
    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{title}</h3>
    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mb-4">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);

const MiniAreaChart = ({ data }: { data: number[] }) => {
  const chartData = data.map((value, index) => ({ value, index }));
  const isPositive = data[data.length - 1] <= data[0];
  
  return (
    <div className="h-12 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="miniGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPositive ? "#10B981" : "#F43F5E"} stopOpacity={0.3} />
              <stop offset="100%" stopColor={isPositive ? "#10B981" : "#F43F5E"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={isPositive ? "#10B981" : "#F43F5E"}
            strokeWidth={2}
            fill="url(#miniGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ExpensesClientEnhanced({
  budget,
  accounts,
  transactions,
  recurringTransactions,
  trips,
  currentMonth,
  currentYear,
}: ExpensesClientEnhancedProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewMode>("transactions");
  const [filter, setFilter] = useState<"all" | "trip" | "general">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date(currentYear, currentMonth - 1));

  const now = new Date();
  const daysPassed = now.getDate();
  const daysInMonth = endOfMonth(now).getDate();

  // ============================================================================
  // DATA PROCESSING
  // ============================================================================

  const processedTransactions = useMemo(() => {
    return transactions.map(t => {
      const currency = t.currency || t.account.currency;
      return {
        ...t,
        amountUSD: toUSD(Math.abs(t.amount), currency),
        originalAmount: Math.abs(t.amount),
        originalCurrency: currency,
        isIncome: t.amount > 0,
        tripName: t.trip?.name || t.trip?.destination,
      };
    });
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return processedTransactions.filter(item => {
      const isTrip = !!item.tripId;
      const matchesFilter = filter === "all" || (filter === "trip" ? isTrip : !isTrip);
      const matchesSearch = !searchQuery || 
        (item.merchantName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesMonth = isSameMonth(new Date(item.date), selectedMonth);
      return matchesFilter && matchesSearch && matchesCategory && matchesMonth;
    });
  }, [processedTransactions, filter, searchQuery, selectedCategory, selectedMonth]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, typeof filteredTransactions> = {};
    filteredTransactions.forEach(item => {
      const dateKey = format(new Date(item.date), "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
  }, [filteredTransactions]);

  // Monthly statistics
  const monthlyStats = useMemo(() => {
    const monthItems = processedTransactions.filter(item => isSameMonth(new Date(item.date), selectedMonth));
    const expenses = monthItems.filter(item => !item.isIncome);
    const income = monthItems.filter(item => item.isIncome);
    
    const totalSpent = expenses.reduce((sum, item) => sum + item.amountUSD, 0);
    const totalIncome = income.reduce((sum, item) => sum + item.amountUSD, 0);
    const tripSpent = expenses.filter(item => !!item.tripId).reduce((sum, item) => sum + item.amountUSD, 0);
    
    // Previous month comparison
    const prevMonth = subMonths(selectedMonth, 1);
    const prevMonthItems = processedTransactions.filter(item => isSameMonth(new Date(item.date), prevMonth));
    const prevMonthSpent = prevMonthItems.filter(item => !item.isIncome).reduce((sum, item) => sum + item.amountUSD, 0);
    const spentChange = prevMonthSpent > 0 ? ((totalSpent - prevMonthSpent) / prevMonthSpent) * 100 : 0;

    // Daily data for mini chart
    const dailySpending: number[] = [];
    for (let i = 1; i <= (isSameMonth(selectedMonth, now) ? daysPassed : daysInMonth); i++) {
      const dayExpenses = expenses.filter(item => new Date(item.date).getDate() === i);
      dailySpending.push(dayExpenses.reduce((sum, item) => sum + item.amountUSD, 0));
    }

    return {
      totalSpent,
      totalIncome,
      tripSpent,
      net: totalIncome - totalSpent,
      dailyAverage: daysPassed > 0 ? totalSpent / daysPassed : 0,
      spentChange,
      transactionCount: monthItems.length,
      dailySpending,
    };
  }, [processedTransactions, selectedMonth, daysPassed, daysInMonth, now]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const expenses = filteredTransactions.filter(item => !item.isIncome);
    const categoryMap = new Map<string, number>();
    expenses.forEach(item => {
      categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + item.amountUSD);
    });
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value, category: getCategory(name) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredTransactions]);

  // Total balance
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, account) => {
      const amount = toUSD(account.balance, account.currency);
      return ["credit_card", "loan", "debt"].includes(account.type) ? sum - amount : sum + amount;
    }, 0);
  }, [accounts]);

  // Budget alerts
  const budgetAlerts = useMemo(() => {
    if (!budget?.envelopes) return [];
    return budget.envelopes
      .filter(env => {
        const total = env.allocated + env.rollover;
        return total > 0 && (env.spent / total) >= 0.8;
      })
      .map(env => ({
        category: env.category,
        percent: Math.round((env.spent / (env.allocated + env.rollover)) * 100),
        remaining: env.allocated + env.rollover - env.spent,
      }))
      .sort((a, b) => b.percent - a.percent);
  }, [budget]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [router]);

  const handleDeleteTransaction = useCallback(async (id: string) => {
    if (!confirm("Delete this transaction? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  }, [router]);

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMMM d");
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setSelectedMonth(prev => direction === "prev" ? subMonths(prev, 1) : subMonths(prev, -1));
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Expenses</h1>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              </button>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {format(selectedMonth, "MMMM yyyy")}
              </span>
              <button
                onClick={() => navigateMonth("next")}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                disabled={isSameMonth(selectedMonth, now)}
              >
                <ChevronRight className={`w-4 h-4 ${isSameMonth(selectedMonth, now) ? "text-zinc-200 dark:text-zinc-700" : "text-zinc-400 dark:text-zinc-500"}`} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className={`p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all ${isRefreshing ? "animate-spin" : ""}`}
            >
              <RefreshCw className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all font-semibold text-sm shadow-lg shadow-zinc-200 dark:shadow-zinc-900 hover:shadow-xl active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Transaction</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mt-6 space-y-6">
        {/* Budget Alerts */}
        {budgetAlerts.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-amber-100">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <span className="font-bold text-amber-900 text-sm">Budget Alerts</span>
              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                {budgetAlerts.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {budgetAlerts.map(alert => (
                <div
                  key={alert.category}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 cursor-pointer ${
                    alert.percent >= 100 
                      ? "bg-red-100 text-red-700 ring-1 ring-red-200" 
                      : "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                  }`}
                  onClick={() => setActiveView("budget")}
                >
                  <span>{getCategory(alert.category).icon}</span>
                  <span>{alert.category}</span>
                  <span className="text-xs opacity-75">{alert.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="flex gap-1.5 p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-x-auto no-scrollbar">
          {[
            { id: "transactions", label: "Transactions", icon: List },
            { id: "budget", label: "Budget", icon: Wallet },
            { id: "trends", label: "Insights", icon: Sparkles },
            { id: "bills", label: "Bills", icon: Bell },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as ViewMode)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-zinc-900 dark:text-white" : ""}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* ================================================================ */}
        {/* TRANSACTIONS VIEW */}
        {/* ================================================================ */}
        {activeView === "transactions" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={TrendingDown}
                label="Spent"
                value={formatCurrency(monthlyStats.totalSpent, "USD", true)}
                trend={monthlyStats.spentChange !== 0 ? { value: Math.abs(Math.round(monthlyStats.spentChange)), positive: monthlyStats.spentChange < 0 } : undefined}
                color="zinc"
              />
              <StatCard
                icon={Calendar}
                label="Daily Average"
                value={formatCurrency(monthlyStats.dailyAverage)}
                subValue={`${daysInMonth - daysPassed} days left`}
                color="blue"
              />
              <StatCard
                icon={Plane}
                label="Travel"
                value={formatCurrency(monthlyStats.tripSpent, "USD", true)}
                subValue={`${trips.length} trips`}
                color="purple"
              />
              <StatCard
                icon={Wallet}
                label="Net Worth"
                value={formatCurrency(totalBalance, "USD", true)}
                color="emerald"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Transaction List */}
              <div className="lg:col-span-2 space-y-4">
                {/* Filter Bar */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-3 shadow-sm sticky top-[88px] z-20">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Filter Pills */}
                    <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                      {[
                        { id: "all", label: "All" },
                        { id: "general", label: "Personal" },
                        { id: "trip", label: "Trips" },
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setFilter(f.id as any)}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            filter === f.id 
                              ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" 
                              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Search */}
                    <div className="flex gap-2 flex-1">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Search transactions..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700 focus:bg-white dark:focus:bg-zinc-800 transition-all"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
                          >
                            <X className="w-3 h-3 text-zinc-400" />
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 rounded-xl transition-all ${
                          showFilters || selectedCategory
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        <Filter className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Category Filters */}
                  {showFilters && (
                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Category</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => setSelectedCategory("")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            !selectedCategory 
                              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" 
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          }`}
                        >
                          All
                        </button>
                        {Object.entries(CATEGORIES).slice(0, 10).map(([name, config]) => (
                          <button
                            key={name}
                            onClick={() => setSelectedCategory(selectedCategory === name ? "" : name)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              selectedCategory === name 
                                ? `${config.bg} ${config.text} ring-1 ${config.ring}` 
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            }`}
                          >
                            <span>{config.icon}</span>
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Transaction Groups */}
                <div className="space-y-4">
                  {groupedTransactions.length > 0 ? (
                    groupedTransactions.map(([dateKey, items]) => (
                      <div key={dateKey} className="space-y-1">
                        <div className="flex items-center justify-between px-3 py-2">
                          <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{getDateLabel(dateKey)}</h3>
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            {items.length} transaction{items.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden divide-y divide-zinc-50 dark:divide-zinc-800">
                          {items.map(item => (
                            <TransactionRow
                              key={item.id}
                              transaction={item}
                              trips={trips}
                              onEdit={() => setEditingTransaction(item)}
                              onDelete={() => handleDeleteTransaction(item.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <EmptyState
                        icon={searchQuery || selectedCategory ? Search : Receipt}
                        title={searchQuery || selectedCategory ? "No matches found" : "No transactions yet"}
                        description={
                          searchQuery || selectedCategory
                            ? "Try adjusting your search or filters"
                            : "Add your first transaction to start tracking"
                        }
                        action={
                          searchQuery || selectedCategory
                            ? { label: "Clear filters", onClick: () => { setSearchQuery(""); setSelectedCategory(""); }}
                            : { label: "Add transaction", onClick: () => setIsAddModalOpen(true) }
                        }
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Accounts Overview */}
                <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl p-5 text-white shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-zinc-400" />
                      Accounts
                    </h2>
                    <Link 
                      href="/accounts" 
                      className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      Manage <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {accounts.slice(0, 4).map(account => (
                      <div 
                        key={account.id} 
                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm">
                            {account.type === "checking" ? "🏦" : account.type === "credit_card" ? "💳" : account.type === "savings" ? "🐷" : "💰"}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{account.name}</div>
                            <div className="text-xs text-zinc-400 capitalize">{account.type.replace("_", " ")}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">
                            {formatCurrency(account.balance, account.currency)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Total Balance</span>
                      <span className="text-xl font-black">{formatCurrency(totalBalance)}</span>
                    </div>
                  </div>
                </div>

                {/* Category Breakdown */}
                {categoryBreakdown.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-sm">
                    <h2 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                      Spending by Category
                    </h2>
                    
                    <div className="h-44 mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={categoryBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {categoryBreakdown.map((_, index) => (
                              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ 
                              borderRadius: '12px', 
                              border: 'none', 
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                              fontSize: '13px',
                              fontWeight: 600,
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2">
                      {categoryBreakdown.slice(0, 5).map((cat, idx) => (
                        <button
                          key={cat.name}
                          onClick={() => setSelectedCategory(selectedCategory === cat.name ? "" : cat.name)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${
                            selectedCategory === cat.name 
                              ? `${cat.category.bg} ${cat.category.ring} ring-1` 
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} 
                            />
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{cat.name}</span>
                          </div>
                          <span className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(cat.value)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mini Spending Chart */}
                {monthlyStats.dailySpending.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-sm">
                    <h2 className="font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                      Daily Spending
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">This month's spending pattern</p>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyStats.dailySpending.map((v, i) => ({ day: i + 1, value: v }))}>
                          <defs>
                            <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="day" 
                            axisLine={false} 
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#A1A1AA' }}
                            tickFormatter={(v) => v % 7 === 1 ? v : ''}
                          />
                          <Tooltip
                            formatter={(value: number) => [formatCurrency(value), "Spent"]}
                            labelFormatter={(label) => `Day ${label}`}
                            contentStyle={{ 
                              borderRadius: '8px', 
                              border: 'none', 
                              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                              fontSize: '12px',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            fill="url(#dailyGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* BUDGET VIEW */}
        {/* ================================================================ */}
        {activeView === "budget" && (
          <BudgetManager
            initialBudget={budget}
            currentMonth={currentMonth}
            currentYear={currentYear}
            onBudgetUpdate={() => router.refresh()}
          />
        )}

        {/* ================================================================ */}
        {/* TRENDS VIEW */}
        {/* ================================================================ */}
        {activeView === "trends" && (
          <SpendingTrends />
        )}

        {/* ================================================================ */}
        {/* BILLS VIEW */}
        {/* ================================================================ */}
        {activeView === "bills" && (
          <SubscriptionsView
            recurringTransactions={recurringTransactions}
            onAdd={() => {/* TODO */}}
            onEdit={() => {/* TODO */}}
            onDelete={async (id) => {
              if (!confirm("Delete this recurring bill?")) return;
              try {
                await fetch(`/api/recurring/${id}`, { method: "DELETE" });
                router.refresh();
              } catch (error) {
                console.error("Failed to delete:", error);
              }
            }}
          />
        )}
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        accounts={accounts}
        trips={trips}
      />

      <EditTransactionModal
        transaction={editingTransaction}
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        accounts={accounts}
        trips={trips}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
