"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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
  ChevronDown,
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
  Loader2,
  Repeat,
} from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis } from "recharts";
import AddTransactionModal from "./AddTransactionModal";
import BudgetManager from "./BudgetManager";
import SubscriptionsView from "./SubscriptionsView";
import EditTransactionModal from "./EditTransactionModal";

// Dynamically import heavy chart analytics component to reduce initial bundle
const SpendingTrends = dynamic(() => import("./SpendingTrends"), {
  loading: () => (
    <div className="h-96 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-2xl animate-pulse">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mx-auto mb-2" />
        <p className="text-sm text-zinc-400">Loading insights...</p>
      </div>
    </div>
  ),
  ssr: false,
});

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
  // Pagination support
  hasMoreTransactions?: boolean;
  nextCursor?: string | null;
  monthlyStats?: {
    totalSpent: number;
    transactionCount: number;
  };
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
  onClick,
}: {
  icon: any;
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: number; positive: boolean };
  color?: string;
  className?: string;
  onClick?: () => void;
}) => {
  const colorClasses: Record<string, { 
    bg: string; 
    icon: string; 
    gradient: string;
    border: string;
  }> = {
    zinc: { 
      bg: "bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900", 
      icon: "text-zinc-700 dark:text-zinc-300",
      gradient: "from-zinc-500 to-zinc-600",
      border: "border-zinc-200 dark:border-zinc-700"
    },
    blue: { 
      bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30", 
      icon: "text-blue-600 dark:text-blue-400",
      gradient: "from-blue-500 to-indigo-600",
      border: "border-blue-200 dark:border-blue-800"
    },
    purple: { 
      bg: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30", 
      icon: "text-purple-600 dark:text-purple-400",
      gradient: "from-purple-500 to-violet-600",
      border: "border-purple-200 dark:border-purple-800"
    },
    emerald: { 
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30", 
      icon: "text-emerald-600 dark:text-emerald-400",
      gradient: "from-emerald-500 to-teal-600",
      border: "border-emerald-200 dark:border-emerald-800"
    },
    amber: { 
      bg: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30", 
      icon: "text-amber-600 dark:text-amber-400",
      gradient: "from-amber-500 to-yellow-600",
      border: "border-amber-200 dark:border-amber-800"
    },
  };
  const colors = colorClasses[color] || colorClasses.zinc;

  return (
    <div 
      onClick={onClick}
      className={`group relative bg-white dark:bg-zinc-900 rounded-2xl border-2 ${colors.border} p-6 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`relative p-3 rounded-2xl ${colors.bg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${
            trend.positive 
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" 
              : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}>
            {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight mb-1.5 leading-none">{value}</div>
      <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">{label}</div>
      {subValue && (
        <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {subValue}
        </div>
      )}
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
  const date = new Date(transaction.date);
  const isTodayDate = isToday(date);
  const isYesterdayDate = isYesterday(date);
  
  // Optimized title generation
  const getTitle = () => {
    if (trip) {
      return `Trip expense: ${trip.name || trip.destination}`;
    }
    return transaction.merchantName || transaction.description || transaction.category;
  };
  
  return (
    <div 
      className="group relative bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-xl hover:shadow-zinc-200/20 dark:hover:shadow-zinc-900/20 transition-all duration-200 mb-3 overflow-hidden"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3 p-4 sm:p-5">
        {/* Optimized Category Icon */}
        <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0 ${category.bg} ${category.text} shadow-md transition-transform duration-200 group-hover:scale-105`}>
          {category.icon}
        </div>

        {/* Optimized Content Layout */}
        <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate mb-2 leading-tight">
              {getTitle()}
            </h4>
            
            {/* Badges Row - Optimized */}
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <span className={`text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-lg ${category.bg} ${category.text} border border-current/20`}>
                {transaction.category}
              </span>
              {trip ? (
                <Link 
                  href={`/trips/${trip.id}`}
                  className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-950/70 dark:to-violet-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:from-purple-200 hover:to-violet-200 dark:hover:from-purple-900/90 dark:hover:to-violet-900/90 transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plane className="w-3 h-3" />
                  <span className="hidden sm:inline">{trip.name || trip.destination}</span>
                  <span className="sm:hidden">{trip.destination}</span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  <Home className="w-3 h-3" />
                  Personal
                </span>
              )}
              {transaction.isRecurring && (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <Repeat className="w-3 h-3" />
                  Recurring
                </span>
              )}
            </div>
            
            {/* Metadata Row - Compact */}
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {isTodayDate ? "Today" : isYesterdayDate ? "Yesterday" : format(date, "MMM d, yyyy")}
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              <span className="flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                {transaction.account.name}
              </span>
              {transaction.receiptUrl && (
                <>
                  <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Receipt className="w-3 h-3" />
                    Receipt
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Amount & Actions - Right Side */}
          <div className="flex items-start gap-2 shrink-0">
            {/* Amount Display */}
            <div className="text-right">
              <div className={`text-lg sm:text-xl font-black tracking-tight ${transaction.isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-white"}`}>
                {transaction.isIncome ? "+" : "-"}{formatCurrency(transaction.originalAmount, transaction.originalCurrency)}
              </div>
              {transaction.originalCurrency !== "USD" && (
                <div className="text-[10px] sm:text-xs font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">
                  ≈ ${transaction.amountUSD.toFixed(2)}
                </div>
              )}
            </div>

            {/* Actions - Optimized */}
            <div className={`flex items-center gap-1 transition-all duration-200 ${showActions ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 sm:translate-x-4"}`}>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-2 sm:p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all hover:scale-110 active:scale-95"
                title="Edit transaction"
              >
                <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-600 dark:text-zinc-400" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-2 sm:p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-950/70 transition-all hover:scale-110 active:scale-95"
                title="Delete transaction"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
        </div>
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
  <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
    <div className="relative mb-6">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center shadow-lg border-2 border-zinc-200 dark:border-zinc-700">
        <Icon className="w-10 h-10 text-zinc-400 dark:text-zinc-500" />
      </div>
      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-600 dark:to-zinc-700 opacity-50 animate-pulse" />
    </div>
    <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-6 py-3 bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-zinc-300/50 dark:hover:shadow-zinc-900/50 hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
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
  hasMoreTransactions,
  nextCursor,
  monthlyStats: initialMonthlyStats,
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

  // Pagination state
  const [allTransactions, setAllTransactions] = useState<Transaction[]>(transactions);
  const [cursor, setCursor] = useState<string | null>(nextCursor || null);
  const [hasMore, setHasMore] = useState(hasMoreTransactions ?? false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(5); // Show only 5 initially

  const now = new Date();
  const daysPassed = now.getDate();
  const daysInMonth = endOfMonth(now).getDate();

  // Load more transactions from API
  const loadMoreTransactions = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.set("paginated", "true");
      params.set("limit", "20");
      if (cursor) params.set("cursor", cursor);
      
      const response = await fetch(`/api/transactions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAllTransactions(prev => [...prev, ...data.transactions]);
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Failed to load more transactions:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, hasMore, isLoadingMore]);

  // Show more transactions already loaded
  const showMoreLoaded = useCallback(() => {
    const newLimit = displayLimit + 10;
    setDisplayLimit(newLimit);
    
    // If we're running low on loaded transactions, fetch more
    if (newLimit >= allTransactions.length - 5 && hasMore) {
      loadMoreTransactions();
    }
  }, [displayLimit, allTransactions.length, hasMore, loadMoreTransactions]);

  // ============================================================================
  // DATA PROCESSING
  // ============================================================================

  const processedTransactions = useMemo(() => {
    return allTransactions.map(t => {
      const currency = t.currency || t.account?.currency || 'USD';
      return {
        ...t,
        amountUSD: toUSD(Math.abs(t.amount), currency),
        originalAmount: Math.abs(t.amount),
        originalCurrency: currency,
        isIncome: t.amount > 0,
        tripName: t.trip?.name || t.trip?.destination,
      };
    });
  }, [allTransactions]);

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

  // Apply display limit for initial load performance
  const displayedTransactions = useMemo(() => {
    return filteredTransactions.slice(0, displayLimit);
  }, [filteredTransactions, displayLimit]);

  const canShowMore = filteredTransactions.length > displayLimit || hasMore;

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, typeof displayedTransactions> = {};
    displayedTransactions.forEach(item => {
      const dateKey = format(new Date(item.date), "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
  }, [displayedTransactions]);

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
      {/* Enhanced Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b-2 border-zinc-200 dark:border-zinc-800 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900">
                <Wallet className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Expenses</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              </button>
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                {format(selectedMonth, "MMMM yyyy")}
              </span>
              <button
                onClick={() => navigateMonth("next")}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={isSameMonth(selectedMonth, now)}
              >
                <ChevronRight className={`w-4 h-4 ${isSameMonth(selectedMonth, now) ? "text-zinc-300 dark:text-zinc-700" : "text-zinc-500 dark:text-zinc-400"}`} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className={`p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all hover:scale-110 active:scale-95 shadow-sm ${
                isRefreshing ? "animate-spin" : ""
              }`}
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-100 text-white dark:text-zinc-900 rounded-xl hover:shadow-xl hover:shadow-zinc-300/50 dark:hover:shadow-zinc-900/50 hover:-translate-y-0.5 transition-all font-bold text-sm active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Transaction</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mt-6 space-y-6">
        {/* Enhanced Budget Alerts */}
        {budgetAlerts.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-red-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 shadow-md">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-base text-amber-900 dark:text-amber-100">Budget Alerts</h3>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Categories approaching limit</p>
                </div>
              </div>
              <span className="text-xs font-black text-amber-900 dark:text-amber-100 bg-white/80 dark:bg-zinc-900/80 px-3 py-1.5 rounded-full border-2 border-amber-300 dark:border-amber-700 shadow-sm">
                {budgetAlerts.length} {budgetAlerts.length === 1 ? 'alert' : 'alerts'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {budgetAlerts.map(alert => {
                const category = getCategory(alert.category);
                return (
                  <button
                    key={alert.category}
                    className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md border-2 ${
                      alert.percent >= 100 
                        ? "bg-gradient-to-r from-red-100 to-red-200 dark:from-red-950/50 dark:to-red-900/50 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800 hover:shadow-lg hover:shadow-red-200/50 dark:hover:shadow-red-900/50" 
                        : "bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800 hover:shadow-lg hover:shadow-amber-200/50 dark:hover:shadow-amber-900/50"
                    }`}
                    onClick={() => setActiveView("budget")}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span>{alert.category}</span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                      alert.percent >= 100 
                        ? "bg-red-300 dark:bg-red-900 text-red-900 dark:text-red-100" 
                        : "bg-amber-300 dark:bg-amber-900 text-amber-900 dark:text-amber-100"
                    }`}>
                      {alert.percent}%
                    </span>
                    <span className="text-xs font-semibold opacity-75">
                      {formatCurrency(Math.abs(alert.remaining), "USD", true)} {alert.remaining >= 0 ? 'left' : 'over'}
                    </span>
                  </button>
                );
              })}
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
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={TrendingDown}
                label="Total Spent"
                value={formatCurrency(monthlyStats.totalSpent, "USD", true)}
                trend={monthlyStats.spentChange !== 0 ? { value: Math.abs(Math.round(monthlyStats.spentChange)), positive: monthlyStats.spentChange < 0 } : undefined}
                subValue={`${monthlyStats.transactionCount} transactions`}
                color="zinc"
              />
              <StatCard
                icon={Calendar}
                label="Daily Average"
                value={formatCurrency(monthlyStats.dailyAverage, "USD", true)}
                subValue={`${daysInMonth - daysPassed} days remaining`}
                color="blue"
              />
              <StatCard
                icon={Plane}
                label="Travel Expenses"
                value={formatCurrency(monthlyStats.tripSpent, "USD", true)}
                subValue={`${trips.length} active trip${trips.length !== 1 ? 's' : ''}`}
                color="purple"
              />
              <StatCard
                icon={Wallet}
                label="Net Worth"
                value={formatCurrency(totalBalance, "USD", true)}
                subValue={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
                color="emerald"
                onClick={() => router.push('/accounts')}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Transaction List */}
              <div className="lg:col-span-2 space-y-4">
                {/* Enhanced Filter Bar */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 p-4 shadow-lg sticky top-[88px] z-20 backdrop-blur-sm bg-white/95 dark:bg-zinc-900/95">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Enhanced Filter Pills */}
                    <div className="flex p-1 bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      {[
                        { id: "all", label: "All", icon: List },
                        { id: "general", label: "Personal", icon: Home },
                        { id: "trip", label: "Trips", icon: Plane },
                      ].map(f => {
                        const Icon = f.icon;
                        return (
                          <button
                            key={f.id}
                            onClick={() => setFilter(f.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                              filter === f.id 
                                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-md scale-105" 
                                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-800/50"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {f.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Enhanced Search */}
                    <div className="flex gap-2 flex-1">
                      <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-300 transition-colors" />
                        <input
                          type="text"
                          placeholder="Search transactions, merchants, categories..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-11 pr-10 py-3 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-500 focus:bg-white dark:focus:bg-zinc-900 transition-all shadow-sm focus:shadow-md"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                          >
                            <X className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`relative p-3 rounded-xl transition-all duration-200 shadow-sm ${
                          showFilters || selectedCategory
                            ? "bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-100 text-white dark:text-zinc-900 shadow-lg scale-105"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:scale-105"
                        }`}
                        title="Filter by category"
                      >
                        <Filter className="w-4 h-4" />
                        {(showFilters || selectedCategory) && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Enhanced Category Filters */}
                  {showFilters && (
                    <div className="mt-4 pt-4 border-t-2 border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                            <Tag className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                          </div>
                          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">Filter by Category</span>
                        </div>
                        {selectedCategory && (
                          <button
                            onClick={() => setSelectedCategory("")}
                            className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedCategory("")}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                            !selectedCategory 
                              ? "bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-100 text-white dark:text-zinc-900 shadow-md scale-105" 
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:scale-105"
                          }`}
                        >
                          All Categories
                        </button>
                        {Object.entries(CATEGORIES).slice(0, 12).map(([name, config]) => (
                          <button
                            key={name}
                            onClick={() => setSelectedCategory(selectedCategory === name ? "" : name)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                              selectedCategory === name 
                                ? `${config.bg} ${config.text} ring-2 ${config.ring} shadow-md scale-105` 
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:scale-105"
                            }`}
                          >
                            <span className="text-base">{config.icon}</span>
                            <span>{name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Transaction Groups */}
                <div className="space-y-6">
                  {groupedTransactions.length > 0 ? (
                    groupedTransactions.map(([dateKey, items]) => {
                      const dayTotal = items.reduce((sum, item) => sum + (item.isIncome ? item.amountUSD : -item.amountUSD), 0);
                      return (
                        <div key={dateKey} className="space-y-3">
                          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-zinc-50 to-transparent dark:from-zinc-900 dark:to-transparent rounded-xl border-2 border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                              </div>
                              <div>
                                <h3 className="text-sm font-black text-zinc-900 dark:text-white">{getDateLabel(dateKey)}</h3>
                                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                  {items.length} transaction{items.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-black ${dayTotal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-white"}`}>
                                {dayTotal >= 0 ? "+" : ""}{formatCurrency(Math.abs(dayTotal), "USD", true)}
                              </div>
                              <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Net</div>
                            </div>
                          </div>
                          <div className="space-y-3">
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
                      );
                    })
                  ) : (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
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

                  {/* Enhanced Show More / Load More Button */}
                  {canShowMore && groupedTransactions.length > 0 && (
                    <div className="space-y-3">
                      <button
                        onClick={showMoreLoaded}
                        disabled={isLoadingMore}
                        className="w-full group relative py-4 px-6 bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-semibold hover:shadow-xl hover:shadow-zinc-300/50 dark:hover:shadow-zinc-900/50 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 to-zinc-700 dark:from-zinc-200 dark:to-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {isLoadingMore ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                            <span className="relative z-10">Loading more...</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-5 h-5 relative z-10 group-hover:translate-y-1 transition-transform" />
                            <span className="relative z-10">
                              {filteredTransactions.length - displayLimit > 0 
                                ? `Show ${Math.min(10, filteredTransactions.length - displayLimit)} More` 
                                : 'Load More Transactions'}
                            </span>
                          </>
                        )}
                      </button>
                      
                      {/* Progress indicator */}
                      <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <div className="h-1.5 flex-1 max-w-[200px] bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-zinc-400 to-zinc-500 dark:from-zinc-500 dark:to-zinc-400 rounded-full transition-all duration-500"
                            style={{ width: `${(displayedTransactions.length / Math.max(filteredTransactions.length, 1)) * 100}%` }}
                          />
                        </div>
                        <span className="font-semibold">
                          {displayedTransactions.length} / {filteredTransactions.length}
                          {hasMore && '+'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Enhanced Accounts Overview */}
                <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl p-6 text-white shadow-2xl border-2 border-zinc-700 hover:shadow-3xl transition-shadow">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-white/10">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      Accounts
                    </h2>
                    <Link 
                      href="/accounts" 
                      className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/10"
                    >
                      Manage <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  
                  <div className="space-y-2.5 mb-5">
                    {accounts.slice(0, 4).map(account => {
                      const isNegative = account.balance < 0;
                      return (
                        <div 
                          key={account.id} 
                          className="group flex items-center justify-between p-3.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/5 hover:border-white/20 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center text-lg shadow-lg group-hover:scale-110 transition-transform">
                              {account.type === "checking" ? "🏦" : account.type === "credit_card" ? "💳" : account.type === "savings" ? "🐷" : "💰"}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{account.name}</div>
                              <div className="text-xs text-zinc-400 capitalize">{account.type.replace("_", " ")}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-black text-sm ${isNegative ? "text-red-300" : "text-white"}`}>
                              {formatCurrency(account.balance, account.currency)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-300">Total Balance</span>
                      <span className={`text-2xl font-black ${totalBalance < 0 ? "text-red-300" : "text-white"}`}>
                        {formatCurrency(totalBalance)}
                      </span>
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
