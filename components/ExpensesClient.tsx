"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";
import { format, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
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
  PieChart
} from "lucide-react";

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
  { name: "Utilities", icon: "💡", color: "bg-yellow-100 text-yellow-700" },
  { name: "Rent/Mortgage", icon: "🏠", color: "bg-red-100 text-red-700" },
  { name: "Entertainment", icon: "🎬", color: "bg-pink-100 text-pink-700" },
  { name: "Shopping", icon: "🛍️", color: "bg-purple-100 text-purple-700" },
  { name: "Healthcare", icon: "⚕️", color: "bg-cyan-100 text-cyan-700" },
  { name: "Subscriptions", icon: "📱", color: "bg-indigo-100 text-indigo-700" },
  { name: "Travel", icon: "✈️", color: "bg-sky-100 text-sky-700" },
  { name: "Accommodation", icon: "🛏️", color: "bg-indigo-100 text-indigo-700" },
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

  const now = new Date();
  const daysPassed = now.getDate();

  // Merge and normalize data
  const unifiedItems: UnifiedExpenseItem[] = useMemo(() => {
    const txItems: UnifiedExpenseItem[] = transactions.map(t => ({
      id: t.id,
      date: new Date(t.date),
      amount: convertToUSD(Math.abs(t.amount), t.account.currency), // Convert transaction amount if account is foreign
      originalAmount: Math.abs(t.amount),
      originalCurrency: t.account.currency,
      category: t.category,
      description: t.merchantName || t.description || t.category,
      type: "transaction",
      tripId: t.tripId,
      location: t.location,
      accountName: t.account.name
    }));

    const expItems: UnifiedExpenseItem[] = expenses.map(e => ({
      id: e.id,
      date: new Date(e.date),
      amount: convertToUSD(e.amount, e.currency),
      originalAmount: e.amount,
      originalCurrency: e.currency,
      category: e.category,
      description: e.note || e.category,
      type: "expense",
      tripId: e.tripId,
      location: e.location,
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

      return matchesFilter && matchesSearch;
    });
  }, [unifiedItems, filter, searchQuery]);

  // Calculate stats for CURRENT MONTH
  const monthlyStats = useMemo(() => {
    const currentMonthItems = unifiedItems.filter(item => 
      isSameMonth(item.date, now)
    );

    const totalSpent = currentMonthItems.reduce((sum, item) => sum + item.amount, 0);
    const dailyAverage = daysPassed > 0 ? totalSpent / daysPassed : 0;
    
    const tripSpent = currentMonthItems
      .filter(item => item.type === "expense" || !!item.tripId)
      .reduce((sum, item) => sum + item.amount, 0);

    return { totalSpent, dailyAverage, tripSpent };
  }, [unifiedItems, daysPassed, now]);

  // Calculate total balance (converted to USD)
  const totalBalanceUSD = useMemo(() => {
    return accounts.reduce((sum, account) => {
      const amount = convertToUSD(account.balance, account.currency);
      // Subtract liabilities (Credit Cards, Loans)
      if (account.type === "credit_card" || account.type === "loan" || account.type === "debt") {
        return sum - amount;
      }
      return sum + amount;
    }, 0);
  }, [accounts]);

  // Group by date
  const groupedItems = useMemo(() => {
    const groups: Record<string, UnifiedExpenseItem[]> = {};
    filteredItems.forEach(item => {
      const dateKey = format(item.date, "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return groups;
  }, [filteredItems]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Expenses</h1>
          <p className="text-zinc-500 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {format(now, "MMMM yyyy")}
          </p>
        </div>
        <Link
          href="/expenses/add"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all font-medium shadow-lg shadow-zinc-200 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add Transaction</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-zinc-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-zinc-900" />
            </div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">This Month</span>
          </div>
          <div className="text-2xl font-bold text-zinc-900 mb-1">
            ${monthlyStats.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500">Total Spent (USD Est.)</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Daily Avg</span>
          </div>
          <div className="text-2xl font-bold text-zinc-900 mb-1">
            ${monthlyStats.dailyAverage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500">Per Day</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Plane className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Travel</span>
          </div>
          <div className="text-2xl font-bold text-zinc-900 mb-1">
            ${monthlyStats.tripSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500">On Trips</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Net Worth</span>
          </div>
          <div className="text-2xl font-bold text-zinc-900 mb-1">
            ${totalBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-zinc-500">Total Balance (USD Est.)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-2 rounded-xl border border-zinc-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-4 z-10">
            <div className="flex p-1 bg-zinc-100 rounded-lg w-full sm:w-auto">
              <button
                onClick={() => setFilter("all")}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filter === "all" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("general")}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filter === "general" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                General
              </button>
              <button
                onClick={() => setFilter("trip")}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filter === "trip" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                Trips
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 border-transparent focus:bg-white border focus:border-zinc-200 rounded-lg text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Transactions */}
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([dateKey, items]) => (
              <div key={dateKey} className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-500 pl-1 sticky top-16 bg-zinc-50/95 backdrop-blur-sm py-2 z-0">
                  {format(new Date(dateKey), "EEEE, MMM d")}
                </h3>
                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                  {items.map((item, i) => {
                    const categoryInfo = EXPENSE_CATEGORIES.find(c => c.name === item.category);
                    const trip = item.tripId ? trips.find(t => t.id === item.tripId) : null;
                    const isTrip = item.type === "expense" || !!trip;

                    return (
                      <div 
                        key={item.id} 
                        className={`p-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors ${
                          i !== items.length - 1 ? "border-b border-zinc-50" : ""
                        }`}
                      >
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg ${categoryInfo?.color || "bg-zinc-100 text-zinc-500"}`}>
                          {categoryInfo?.icon || "📦"}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="font-semibold text-zinc-900 truncate">
                              {item.description}
                            </h4>
                            <div className="text-right">
                              <div className="font-bold text-zinc-900">
                                {getCurrencySymbol(item.originalCurrency)}{item.originalAmount.toFixed(2)}
                              </div>
                              {item.originalCurrency !== "USD" && (
                                <div className="text-[10px] text-zinc-400 font-medium">
                                  ~${item.amount.toFixed(2)} USD
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span className="capitalize">{item.category}</span>
                            {isTrip ? (
                              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                <Plane className="w-3 h-3" />
                                {trip?.destination || item.location || "Trip"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                <Home className="w-3 h-3" />
                                Life
                              </span>
                            )}
                            {item.accountName && (
                              <>
                                <span className="text-zinc-300">•</span>
                                <span>{item.accountName}</span>
                              </>
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
               <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100 border-dashed">
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-zinc-300" />
                </div>
                <h3 className="text-lg font-medium text-zinc-900">No transactions found</h3>
                <p className="text-zinc-500 text-sm">Try adjusting filters or search</p>
               </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Accounts */}
          <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Accounts
            </h2>
            <div className="space-y-4">
              {accounts.map(account => (
                <div key={account.id} className="flex justify-between items-center p-3 bg-white/10 rounded-xl hover:bg-white/15 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">
                      {account.type === "checking" ? "🏦" : account.type === "credit_card" ? "💳" : "💰"}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{account.name}</div>
                      <div className="text-xs text-zinc-400 capitalize">{account.type.replace("_", " ")}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">
                      {getCurrencySymbol(account.currency)}{account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {account.currency !== "USD" && (
                      <div className="text-[10px] text-zinc-400">
                        ~${convertToUSD(account.balance, account.currency).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2.5 bg-white text-zinc-900 rounded-lg text-sm font-bold hover:bg-zinc-100 transition-colors">
              Manage Accounts
            </button>
          </div>

          {/* Category Breakdown (Mini) */}
          {budget && (
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5" /> Categories
              </h2>
              <div className="space-y-3">
                {budget.envelopes.slice(0, 5).map(env => {
                   const percent = Math.min((env.spent / env.allocated) * 100, 100);
                   return (
                    <div key={env.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-zinc-700">{env.category}</span>
                        <span className="text-zinc-500">${env.spent.toFixed(0)} / ${env.allocated.toFixed(0)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${percent > 100 ? "bg-red-500" : "bg-zinc-900"}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                   );
                })}
              </div>
              <Link href="/expenses/budget" className="block mt-4 text-center text-sm font-medium text-zinc-600 hover:text-zinc-900">
                View Full Budget
              </Link>
            </div>
          )}

          {/* Recurring */}
          {recurringTransactions.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                 <Calendar className="w-5 h-5" /> Upcoming
              </h2>
              <div className="space-y-3">
                {recurringTransactions.slice(0, 3).map(rec => (
                  <div key={rec.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-sm font-medium text-zinc-700">{rec.name}</span>
                    </div>
                    <span className="text-sm font-bold text-zinc-900">${rec.amount}</span>
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
