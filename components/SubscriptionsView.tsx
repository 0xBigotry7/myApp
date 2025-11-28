"use client";

import { useState, useMemo } from "react";
import { format, addDays, isPast, isFuture, isToday, differenceInDays } from "date-fns";
import {
  Bell,
  Calendar,
  CreditCard,
  Plus,
  Edit3,
  Trash2,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Pause,
  Play,
  X,
  DollarSign,
  TrendingUp,
  Filter,
  SortAsc,
  MoreHorizontal,
  Zap,
  Wifi,
  Music,
  Video,
  Shield,
  Cloud,
  Code,
  Gamepad2,
  Newspaper,
  Dumbbell,
  Briefcase,
  Heart,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: string;
  nextDate: string;
  merchantName?: string;
  isActive: boolean;
  icon?: string;
  color?: string;
  notes?: string;
}

interface SubscriptionsViewProps {
  recurringTransactions: RecurringTransaction[];
  onAdd: () => void;
  onEdit: (transaction: RecurringTransaction) => void;
  onDelete: (id: string) => Promise<void>;
}

type SortBy = "date" | "amount" | "name";
type FilterBy = "all" | "active" | "paused" | "due-soon";

// ============================================================================
// CONSTANTS
// ============================================================================

const FREQUENCY_LABELS: Record<string, { label: string; monthlyMultiplier: number }> = {
  daily: { label: "Daily", monthlyMultiplier: 30 },
  weekly: { label: "Weekly", monthlyMultiplier: 4.33 },
  biweekly: { label: "Every 2 weeks", monthlyMultiplier: 2.17 },
  monthly: { label: "Monthly", monthlyMultiplier: 1 },
  quarterly: { label: "Every 3 months", monthlyMultiplier: 0.33 },
  yearly: { label: "Yearly", monthlyMultiplier: 0.083 },
  annual: { label: "Yearly", monthlyMultiplier: 0.083 },
};

const SERVICE_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  netflix: { icon: Video, color: "text-red-500", bg: "bg-red-50" },
  spotify: { icon: Music, color: "text-green-500", bg: "bg-green-50" },
  youtube: { icon: Video, color: "text-red-500", bg: "bg-red-50" },
  amazon: { icon: Briefcase, color: "text-orange-500", bg: "bg-orange-50" },
  disney: { icon: Video, color: "text-blue-500", bg: "bg-blue-50" },
  hulu: { icon: Video, color: "text-emerald-500", bg: "bg-emerald-50" },
  apple: { icon: Cloud, color: "text-zinc-700", bg: "bg-zinc-100" },
  icloud: { icon: Cloud, color: "text-blue-500", bg: "bg-blue-50" },
  dropbox: { icon: Cloud, color: "text-blue-600", bg: "bg-blue-50" },
  google: { icon: Cloud, color: "text-red-500", bg: "bg-zinc-50" },
  microsoft: { icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
  github: { icon: Code, color: "text-zinc-800", bg: "bg-zinc-100" },
  notion: { icon: Newspaper, color: "text-zinc-800", bg: "bg-zinc-100" },
  figma: { icon: Code, color: "text-purple-600", bg: "bg-purple-50" },
  gym: { icon: Dumbbell, color: "text-amber-500", bg: "bg-amber-50" },
  fitness: { icon: Dumbbell, color: "text-orange-500", bg: "bg-orange-50" },
  insurance: { icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
  internet: { icon: Wifi, color: "text-cyan-500", bg: "bg-cyan-50" },
  phone: { icon: Zap, color: "text-purple-500", bg: "bg-purple-50" },
  electric: { icon: Zap, color: "text-yellow-500", bg: "bg-yellow-50" },
  utilities: { icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
  gaming: { icon: Gamepad2, color: "text-indigo-500", bg: "bg-indigo-50" },
  health: { icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
};

const formatCurrency = (amount: number) => {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getServiceIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(SERVICE_ICONS)) {
    if (lowerName.includes(key)) {
      return value;
    }
  }
  return { icon: CreditCard, color: "text-zinc-500", bg: "bg-zinc-100" };
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const BillCard = ({
  bill,
  onEdit,
  onDelete,
  onToggle,
}: {
  bill: RecurringTransaction;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) => {
  const [showActions, setShowActions] = useState(false);
  
  const service = getServiceIcon(bill.name);
  const Icon = service.icon;
  
  const nextDate = new Date(bill.nextDate);
  const daysUntil = differenceInDays(nextDate, new Date());
  const isOverdue = isPast(nextDate) && !isToday(nextDate);
  const isDueSoon = daysUntil >= 0 && daysUntil <= 7;
  
  const frequencyInfo = FREQUENCY_LABELS[bill.frequency] || { label: bill.frequency, monthlyMultiplier: 1 };

  return (
    <div
      className={`group relative bg-white rounded-2xl border border-zinc-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-zinc-100/50 hover:border-zinc-200 ${
        !bill.isActive ? "opacity-60" : ""
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Urgent indicator */}
      {isOverdue && bill.isActive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-500" />
      )}
      {isDueSoon && !isOverdue && bill.isActive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
      )}

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${service.bg} transition-transform duration-200 group-hover:scale-110`}>
            <Icon className={`w-5 h-5 ${service.color}`} />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-zinc-900 truncate">{bill.name}</h3>
              {!bill.isActive && (
                <span className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full font-medium">
                  Paused
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-zinc-500">{frequencyInfo.label}</span>
              <span className="text-zinc-300">•</span>
              {isOverdue ? (
                <span className="flex items-center gap-1 text-red-600 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Overdue
                </span>
              ) : isToday(nextDate) ? (
                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  Due today
                </span>
              ) : isDueSoon ? (
                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  Due in {daysUntil} day{daysUntil !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-zinc-400">
                  {format(nextDate, "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="text-right shrink-0">
            <div className="text-lg font-black text-zinc-900">
              {formatCurrency(Math.abs(bill.amount))}
            </div>
            <div className="text-xs text-zinc-400">
              {frequencyInfo.label.toLowerCase()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={`absolute top-3 right-3 flex gap-1 transition-all duration-200 ${showActions ? "opacity-100" : "opacity-0"}`}>
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
            title={bill.isActive ? "Pause" : "Resume"}
          >
            {bill.isActive ? (
              <Pause className="w-4 h-4 text-zinc-400" />
            ) : (
              <Play className="w-4 h-4 text-emerald-500" />
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <Edit3 className="w-4 h-4 text-zinc-400" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors group/delete"
          >
            <Trash2 className="w-4 h-4 text-zinc-400 group-hover/delete:text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  subValue,
  color = "zinc",
}: {
  icon: any;
  label: string;
  value: string;
  subValue?: string;
  color?: string;
}) => {
  const colorClasses: Record<string, { bg: string; icon: string }> = {
    zinc: { bg: "bg-zinc-100", icon: "text-zinc-600" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600" },
    red: { bg: "bg-red-50", icon: "text-red-600" },
  };
  const colors = colorClasses[color] || colorClasses.zinc;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-5 hover:shadow-lg hover:shadow-zinc-100/50 hover:border-zinc-200 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${colors.bg}`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
      </div>
      <div className="text-2xl font-black text-zinc-900">{value}</div>
      <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">{label}</div>
      {subValue && <div className="text-xs text-zinc-400 mt-1">{subValue}</div>}
    </div>
  );
};

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-6">
      <Bell className="w-9 h-9 text-purple-500" />
    </div>
    <h3 className="text-xl font-bold text-zinc-900 mb-2">No Recurring Bills Yet</h3>
    <p className="text-sm text-zinc-500 max-w-sm mb-6">
      Track your subscriptions and recurring payments to never miss a bill and see your monthly commitments.
    </p>
    <button
      onClick={onAdd}
      className="flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all font-semibold text-sm shadow-lg shadow-zinc-200 hover:shadow-xl active:scale-95"
    >
      <Plus className="w-4 h-4" />
      Add Your First Bill
    </button>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SubscriptionsView({
  recurringTransactions,
  onAdd,
  onEdit,
  onDelete,
}: SubscriptionsViewProps) {
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [filterBy, setFilterBy] = useState<FilterBy>("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Process and filter bills
  const processedBills = useMemo(() => {
    let bills = [...recurringTransactions];

    // Filter
    if (filterBy === "active") {
      bills = bills.filter(b => b.isActive);
    } else if (filterBy === "paused") {
      bills = bills.filter(b => !b.isActive);
    } else if (filterBy === "due-soon") {
      bills = bills.filter(b => {
        const daysUntil = differenceInDays(new Date(b.nextDate), new Date());
        return daysUntil <= 7 && daysUntil >= 0 && b.isActive;
      });
    }

    // Sort
    if (sortBy === "date") {
      bills.sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());
    } else if (sortBy === "amount") {
      bills.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    } else if (sortBy === "name") {
      bills.sort((a, b) => a.name.localeCompare(b.name));
    }

    return bills;
  }, [recurringTransactions, sortBy, filterBy]);

  // Stats
  const stats = useMemo(() => {
    const active = recurringTransactions.filter(b => b.isActive);
    const monthlyTotal = active.reduce((sum, bill) => {
      const freq = FREQUENCY_LABELS[bill.frequency] || { monthlyMultiplier: 1 };
      return sum + Math.abs(bill.amount) * freq.monthlyMultiplier;
    }, 0);

    const yearlyTotal = monthlyTotal * 12;

    const dueSoon = active.filter(b => {
      const daysUntil = differenceInDays(new Date(b.nextDate), new Date());
      return daysUntil <= 7 && daysUntil >= 0;
    });

    const overdue = active.filter(b => {
      const nextDate = new Date(b.nextDate);
      return isPast(nextDate) && !isToday(nextDate);
    });

    return { monthlyTotal, yearlyTotal, dueSoon: dueSoon.length, overdue: overdue.length, total: active.length };
  }, [recurringTransactions]);

  // Handlers
  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await onDelete(id);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggle = (bill: RecurringTransaction) => {
    // TODO: Implement toggle
    console.log("Toggle", bill.id);
  };

  // Render empty state
  if (!recurringTransactions.length) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100">
        <EmptyState onAdd={onAdd} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Monthly Cost"
          value={formatCurrency(stats.monthlyTotal)}
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          label="Yearly Cost"
          value={formatCurrency(stats.yearlyTotal)}
          subValue={`${stats.total} active subscriptions`}
          color="zinc"
        />
        <StatCard
          icon={Clock}
          label="Due Soon"
          value={stats.dueSoon.toString()}
          subValue="Next 7 days"
          color={stats.dueSoon > 0 ? "amber" : "emerald"}
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue"
          value={stats.overdue.toString()}
          subValue="Need attention"
          color={stats.overdue > 0 ? "red" : "emerald"}
        />
      </div>

      {/* Header & Controls */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-zinc-100">
          <div>
            <h2 className="font-bold text-zinc-900 text-lg">Recurring Bills</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{recurringTransactions.length} subscriptions tracked</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterBy)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-50 border-none rounded-xl text-sm font-medium text-zinc-700 focus:ring-2 focus:ring-zinc-200 cursor-pointer"
            >
              <option value="all">All Bills</option>
              <option value="active">Active Only</option>
              <option value="paused">Paused</option>
              <option value="due-soon">Due Soon</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-50 border-none rounded-xl text-sm font-medium text-zinc-700 focus:ring-2 focus:ring-zinc-200 cursor-pointer"
            >
              <option value="date">By Date</option>
              <option value="amount">By Amount</option>
              <option value="name">By Name</option>
            </select>

            {/* Add Button */}
            <button
              onClick={onAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all font-semibold text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Bill</span>
            </button>
          </div>
        </div>

        {/* Bills List */}
        <div className="p-4">
          {processedBills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processedBills.map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  onEdit={() => onEdit(bill)}
                  onDelete={() => handleDelete(bill.id)}
                  onToggle={() => handleToggle(bill)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Filter className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500 font-medium">No bills match your filters</p>
              <button
                onClick={() => setFilterBy("all")}
                className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-semibold"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Timeline */}
      {stats.dueSoon > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-amber-900">Due This Week</h3>
          </div>
          <div className="space-y-3">
            {processedBills
              .filter(b => {
                const daysUntil = differenceInDays(new Date(b.nextDate), new Date());
                return daysUntil <= 7 && daysUntil >= 0 && b.isActive;
              })
              .slice(0, 5)
              .map((bill) => {
                const nextDate = new Date(bill.nextDate);
                const service = getServiceIcon(bill.name);
                const Icon = service.icon;
                return (
                  <div
                    key={bill.id}
                    className="flex items-center gap-3 p-3 bg-white/80 rounded-xl"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${service.bg}`}>
                      <Icon className={`w-4 h-4 ${service.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-zinc-900 text-sm truncate">{bill.name}</div>
                      <div className="text-xs text-zinc-500">
                        {isToday(nextDate) ? "Today" : format(nextDate, "EEEE, MMM d")}
                      </div>
                    </div>
                    <div className="font-bold text-zinc-900">
                      {formatCurrency(Math.abs(bill.amount))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
