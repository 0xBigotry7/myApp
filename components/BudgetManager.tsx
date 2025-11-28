"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Plus,
  Settings,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  PiggyBank,
  RefreshCw,
  X,
  Edit3,
  Trash2,
  DollarSign,
  Target,
  ArrowRight,
  Check,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

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
  totalSpent?: number;
  spendingByCategory?: Record<string, number>;
}

interface BudgetManagerProps {
  initialBudget: Budget | null;
  currentMonth: number;
  currentYear: number;
  onBudgetUpdate?: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIES: Record<string, { icon: string; color: string; gradient: string }> = {
  Groceries: { icon: "🛒", color: "bg-emerald-50 text-emerald-600 ring-emerald-200", gradient: "from-emerald-500 to-teal-600" },
  Dining: { icon: "🍽️", color: "bg-orange-50 text-orange-600 ring-orange-200", gradient: "from-orange-500 to-amber-600" },
  Transportation: { icon: "🚗", color: "bg-blue-50 text-blue-600 ring-blue-200", gradient: "from-blue-500 to-indigo-600" },
  Utilities: { icon: "⚡", color: "bg-yellow-50 text-yellow-600 ring-yellow-200", gradient: "from-yellow-500 to-orange-500" },
  "Rent/Mortgage": { icon: "🏠", color: "bg-rose-50 text-rose-600 ring-rose-200", gradient: "from-rose-500 to-pink-600" },
  Entertainment: { icon: "🎬", color: "bg-pink-50 text-pink-600 ring-pink-200", gradient: "from-pink-500 to-rose-600" },
  Shopping: { icon: "🛍️", color: "bg-purple-50 text-purple-600 ring-purple-200", gradient: "from-purple-500 to-violet-600" },
  Healthcare: { icon: "⚕️", color: "bg-cyan-50 text-cyan-600 ring-cyan-200", gradient: "from-cyan-500 to-blue-600" },
  Subscriptions: { icon: "📱", color: "bg-indigo-50 text-indigo-600 ring-indigo-200", gradient: "from-indigo-500 to-purple-600" },
  Travel: { icon: "✈️", color: "bg-sky-50 text-sky-600 ring-sky-200", gradient: "from-sky-500 to-blue-600" },
  Savings: { icon: "💰", color: "bg-amber-50 text-amber-600 ring-amber-200", gradient: "from-amber-500 to-yellow-600" },
  Education: { icon: "📚", color: "bg-violet-50 text-violet-600 ring-violet-200", gradient: "from-violet-500 to-purple-600" },
  Personal: { icon: "👤", color: "bg-slate-50 text-slate-600 ring-slate-200", gradient: "from-slate-500 to-zinc-600" },
  Other: { icon: "📦", color: "bg-zinc-100 text-zinc-600 ring-zinc-200", gradient: "from-zinc-500 to-slate-600" },
};

const ALL_CATEGORIES = Object.keys(CATEGORIES);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const QUICK_AMOUNTS = [100, 250, 500, 750, 1000, 1500];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatCurrency = (amount: number, compact = false) => {
  if (compact && Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const getEnvelopeStatus = (spent: number, total: number) => {
  if (total === 0) return { color: "zinc", label: "Not set", percent: 0 };
  const percent = (spent / total) * 100;
  if (percent >= 100) return { color: "red", label: "Over budget", percent };
  if (percent >= 90) return { color: "amber", label: "Almost gone", percent };
  if (percent >= 75) return { color: "yellow", label: "Getting low", percent };
  return { color: "emerald", label: "On track", percent };
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const ProgressRing = ({ percent, size = 60, strokeWidth = 6 }: { percent: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
  
  const getColor = () => {
    if (percent >= 100) return "#EF4444";
    if (percent >= 90) return "#F59E0B";
    if (percent >= 75) return "#EAB308";
    return "#10B981";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black text-zinc-900 dark:text-white">{Math.round(percent)}%</span>
      </div>
    </div>
  );
};

const EnvelopeCard = ({
  envelope,
  onEdit,
  onDelete,
}: {
  envelope: BudgetEnvelope;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const category = CATEGORIES[envelope.category] || CATEGORIES.Other;
  const total = envelope.allocated + envelope.rollover;
  const remaining = total - envelope.spent;
  const status = getEnvelopeStatus(envelope.spent, total);
  const percentUsed = total > 0 ? (envelope.spent / total) * 100 : 0;

  return (
    <div
      className="group relative bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 p-6 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50 hover:border-zinc-200 dark:hover:border-zinc-700 hover:-translate-y-0.5 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Actions */}
      <div className={`absolute top-4 right-4 flex gap-1 transition-all duration-200 ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"}`}>
        <button
          onClick={onEdit}
          className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all hover:scale-110 active:scale-95 shadow-sm"
          title="Edit envelope"
        >
          <Edit3 className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all hover:scale-110 active:scale-95 shadow-sm group/delete"
          title="Delete envelope"
        >
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400 group-hover/delete:scale-110 transition-transform" />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${category.color.split(' ')[0]} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg`}>
          {category.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-lg text-zinc-900 dark:text-white truncate mb-1">{envelope.category}</h3>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span>{formatCurrency(envelope.allocated)} budgeted</span>
            {envelope.rollover > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(envelope.rollover)} rollover</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Progress Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Progress</span>
          <span className={`text-sm font-black ${
            percentUsed >= 100 ? "text-red-600 dark:text-red-400" :
            percentUsed >= 90 ? "text-amber-600 dark:text-amber-400" :
            "text-zinc-900 dark:text-white"
          }`}>
            {percentUsed.toFixed(0)}%
          </span>
        </div>
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
              status.color === "red" ? "bg-gradient-to-r from-red-500 to-red-600" :
              status.color === "amber" ? "bg-gradient-to-r from-amber-500 to-amber-600" :
              status.color === "yellow" ? "bg-gradient-to-r from-yellow-500 to-yellow-600" :
              "bg-gradient-to-r from-emerald-500 to-emerald-600"
            }`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          {status.color === "red" ? (
            <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/50">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
          ) : status.color === "amber" || status.color === "yellow" ? (
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          ) : (
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          )}
          <div>
            <div className={`text-sm font-black ${
              remaining < 0 ? "text-red-600 dark:text-red-400" :
              status.color === "amber" ? "text-amber-600 dark:text-amber-400" :
              "text-emerald-600 dark:text-emerald-400"
            }`}>
              {remaining < 0 ? `-${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)} {remaining >= 0 ? "left" : "over"}
            </div>
            <div className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
              {formatCurrency(envelope.spent)} spent
            </div>
          </div>
        </div>
        <ProgressRing percent={percentUsed} size={56} strokeWidth={6} />
      </div>
    </div>
  );
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 fade-in duration-200 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
          <h3 className="text-xl font-bold text-zinc-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BudgetManager({
  initialBudget,
  currentMonth,
  currentYear,
  onBudgetUpdate,
}: BudgetManagerProps) {
  const router = useRouter();
  const [budget, setBudget] = useState<Budget | null>(initialBudget);
  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showAddEnvelope, setShowAddEnvelope] = useState(false);
  const [editingEnvelope, setEditingEnvelope] = useState<BudgetEnvelope | null>(null);

  // Form state
  const [totalIncome, setTotalIncome] = useState(budget?.totalIncome?.toString() || "");
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const stats = useMemo(() => {
    if (!budget?.envelopes?.length) return null;

    const totalAllocated = budget.envelopes.reduce((sum, e) => sum + e.allocated, 0);
    const totalSpent = budget.envelopes.reduce((sum, e) => sum + e.spent, 0);
    const totalRollover = budget.envelopes.reduce((sum, e) => sum + e.rollover, 0);
    const totalAvailable = totalAllocated + totalRollover - totalSpent;
    const unallocated = (budget.totalIncome || 0) - totalAllocated;
    const percentUsed = totalAllocated > 0 ? (totalSpent / (totalAllocated + totalRollover)) * 100 : 0;

    return { totalAllocated, totalSpent, totalRollover, totalAvailable, unallocated, percentUsed };
  }, [budget]);

  const availableCategories = ALL_CATEGORIES.filter(
    (cat) => !budget?.envelopes?.some((e) => e.category === cat)
  );

  const sortedEnvelopes = useMemo(() => {
    if (!budget?.envelopes) return [];
    return [...budget.envelopes].sort((a, b) => {
      const aPercent = (a.allocated + a.rollover) > 0 ? a.spent / (a.allocated + a.rollover) : 0;
      const bPercent = (b.allocated + b.rollover) > 0 ? b.spent / (b.allocated + b.rollover) : 0;
      return bPercent - aPercent;
    });
  }, [budget]);

  // ============================================================================
  // API CALLS
  // ============================================================================

  const fetchBudget = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/budgets?month=${currentMonth}&year=${currentYear}`);
      if (res.ok) {
        const data = await res.json();
        setBudget(data.id ? data : null);
      }
    } catch (error) {
      console.error("Failed to fetch budget:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, currentYear]);

  const handleSaveIncome = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: currentMonth,
          year: currentYear,
          totalIncome: parseFloat(totalIncome) || 0,
          envelopes: budget?.envelopes || [],
        }),
      });

      if (res.ok) {
        await fetchBudget();
        setShowSetup(false);
        onBudgetUpdate?.();
      }
    } catch (error) {
      console.error("Failed to save budget:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEnvelope = async () => {
    if ((!editingEnvelope && !newCategory) || !newAmount) return;

    setIsLoading(true);
    try {
      const existingEnvelopes = budget?.envelopes || [];
      const categoryToUse = editingEnvelope?.category || newCategory;
      const existingIndex = existingEnvelopes.findIndex((e) => e.category === categoryToUse);

      let updatedEnvelopes;
      if (existingIndex >= 0) {
        updatedEnvelopes = [...existingEnvelopes];
        updatedEnvelopes[existingIndex] = {
          ...updatedEnvelopes[existingIndex],
          allocated: parseFloat(newAmount) || 0,
        };
      } else {
        const config = CATEGORIES[newCategory] || CATEGORIES.Other;
        updatedEnvelopes = [
          ...existingEnvelopes,
          {
            category: newCategory,
            allocated: parseFloat(newAmount) || 0,
            rollover: 0,
            spent: 0,
            icon: config.icon,
          },
        ];
      }

      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: currentMonth,
          year: currentYear,
          totalIncome: budget?.totalIncome || 0,
          envelopes: updatedEnvelopes,
        }),
      });

      if (res.ok) {
        await fetchBudget();
        setShowAddEnvelope(false);
        setEditingEnvelope(null);
        setNewCategory("");
        setNewAmount("");
        onBudgetUpdate?.();
      }
    } catch (error) {
      console.error("Failed to save envelope:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEnvelope = async (envelopeId: string) => {
    if (!confirm("Delete this budget category?")) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/budgets?envelopeId=${envelopeId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchBudget();
        onBudgetUpdate?.();
      }
    } catch (error) {
      console.error("Failed to delete envelope:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyRollover = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/budgets/rollover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetMonth: currentMonth, targetYear: currentYear }),
      });
      if (res.ok) {
        await fetchBudget();
        onBudgetUpdate?.();
      }
    } catch (error) {
      console.error("Failed to apply rollover:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RENDER: EMPTY STATE
  // ============================================================================

  if (!budget?.envelopes?.length) {
    return (
      <>
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl p-8 text-white shadow-2xl">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <PiggyBank className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight">Budget Planner</h2>
                <p className="text-white/70 font-medium">{MONTH_NAMES[currentMonth - 1]} {currentYear}</p>
              </div>
            </div>

            <p className="text-lg text-white/80 mb-8 max-w-md">
              Take control of your money with envelope budgeting. Assign every dollar a job and watch your savings grow.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {["Groceries", "Entertainment", "Savings"].map((cat) => {
                const config = CATEGORIES[cat];
                return (
                  <div key={cat} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center hover:bg-white/20 transition-colors">
                    <div className="text-4xl mb-2">{config.icon}</div>
                    <div className="text-sm font-semibold text-white/80">{cat}</div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowSetup(true)}
              className="w-full py-4 bg-white text-purple-600 rounded-2xl font-bold text-lg hover:bg-white/95 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Get Started
            </button>
          </div>
        </div>

        {/* Setup Modal */}
        <Modal isOpen={showSetup} onClose={() => setShowSetup(false)} title="Set Up Your Budget">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">
                What's your monthly income?
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="number"
                  value={totalIncome}
                  onChange={(e) => setTotalIncome(e.target.value)}
                  placeholder="5,000"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xl font-bold text-zinc-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                This is your total income for {MONTH_NAMES[currentMonth - 1]}
              </p>
            </div>

            <div className="flex gap-2">
              {[3000, 5000, 7500, 10000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTotalIncome(amt.toString())}
                  className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm font-semibold text-zinc-700 transition-colors"
                >
                  ${(amt / 1000).toFixed(0)}k
                </button>
              ))}
            </div>

            <button
              onClick={handleSaveIncome}
              disabled={isLoading || !totalIncome}
              className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </Modal>
      </>
    );
  }

  // ============================================================================
  // RENDER: MAIN VIEW
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{MONTH_NAMES[currentMonth - 1]} Budget</h2>
                <p className="text-white/50 text-sm">Envelope System</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleApplyRollover}
                disabled={isLoading}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                title="Apply rollover from last month"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => {
                  setTotalIncome(budget.totalIncome?.toString() || "");
                  setShowSetup(true);
                }}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-white/50 text-xs font-medium mb-1">Monthly Income</p>
              <p className="text-2xl font-black">{formatCurrency(budget.totalIncome || 0)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-white/50 text-xs font-medium mb-1">Allocated</p>
              <p className="text-2xl font-black">{formatCurrency(stats?.totalAllocated || 0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-2xl p-4 border ${
              (stats?.totalAvailable || 0) >= 0
                ? "bg-emerald-500/20 border-emerald-500/30"
                : "bg-red-500/20 border-red-500/30"
            }`}>
              <p className={`text-xs font-medium mb-1 ${
                (stats?.totalAvailable || 0) >= 0 ? "text-emerald-300" : "text-red-300"
              }`}>
                Available
              </p>
              <p className={`text-2xl font-black ${
                (stats?.totalAvailable || 0) >= 0 ? "text-emerald-400" : "text-red-400"
              }`}>
                {formatCurrency(stats?.totalAvailable || 0)}
              </p>
            </div>
            <div className={`rounded-2xl p-4 border ${
              (stats?.unallocated || 0) > 0
                ? "bg-amber-500/20 border-amber-500/30"
                : "bg-white/5 border-white/10"
            }`}>
              <p className={`text-xs font-medium mb-1 ${
                (stats?.unallocated || 0) > 0 ? "text-amber-300" : "text-white/50"
              }`}>
                Unallocated
              </p>
              <p className={`text-2xl font-black ${
                (stats?.unallocated || 0) > 0 ? "text-amber-400" : "text-white/60"
              }`}>
                {formatCurrency(stats?.unallocated || 0)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {stats && stats.totalAllocated > 0 && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Overall Progress</span>
                <span className="font-bold">{stats.percentUsed.toFixed(0)}% used</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    stats.percentUsed >= 100 ? "bg-red-500" :
                    stats.percentUsed >= 80 ? "bg-amber-500" :
                    "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, stats.percentUsed)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Envelopes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-zinc-900">Budget Categories</h3>
          <button
            onClick={() => {
              setEditingEnvelope(null);
              setNewCategory("");
              setNewAmount("");
              setShowAddEnvelope(true);
            }}
            className="flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sortedEnvelopes.map((envelope) => (
            <EnvelopeCard
              key={envelope.id || envelope.category}
              envelope={envelope}
              onEdit={() => {
                setEditingEnvelope(envelope);
                setNewAmount(envelope.allocated.toString());
                setShowAddEnvelope(true);
              }}
              onDelete={() => envelope.id && handleDeleteEnvelope(envelope.id)}
            />
          ))}
        </div>
      </div>

      {/* Add/Edit Envelope Modal */}
      <Modal
        isOpen={showAddEnvelope}
        onClose={() => {
          setShowAddEnvelope(false);
          setEditingEnvelope(null);
          setNewCategory("");
          setNewAmount("");
        }}
        title={editingEnvelope ? "Edit Category" : "Add Budget Category"}
      >
        <div className="space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-3">
              {editingEnvelope ? "Category" : "Choose a Category"}
            </label>
            {editingEnvelope ? (
              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl">
                <span className="text-3xl">{CATEGORIES[editingEnvelope.category]?.icon || "📦"}</span>
                <span className="font-bold text-zinc-900">{editingEnvelope.category}</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-2">
                {availableCategories.map((cat) => {
                  const config = CATEGORIES[cat];
                  const isSelected = newCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`p-3 rounded-xl text-center transition-all duration-200 ${
                        isSelected
                          ? "bg-purple-100 ring-2 ring-purple-500 scale-105"
                          : "bg-zinc-50 hover:bg-zinc-100"
                      }`}
                    >
                      <div className="text-2xl mb-1">{config.icon}</div>
                      <div className="text-[10px] font-semibold text-zinc-600 truncate">
                        {cat.split("/")[0]}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">
              Monthly Budget Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="500"
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xl font-bold text-zinc-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Quick Amounts */}
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setNewAmount(amt.toString())}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  newAmount === amt.toString()
                    ? "bg-purple-100 text-purple-700 ring-1 ring-purple-300"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                ${amt.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowAddEnvelope(false);
                setEditingEnvelope(null);
                setNewCategory("");
                setNewAmount("");
              }}
              className="flex-1 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEnvelope}
              disabled={isLoading || (!editingEnvelope && !newCategory) || !newAmount}
              className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {editingEnvelope ? "Update" : "Add Category"}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={showSetup} onClose={() => setShowSetup(false)} title="Budget Settings">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">
              Monthly Income
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="number"
                value={totalIncome}
                onChange={(e) => setTotalIncome(e.target.value)}
                placeholder="5,000"
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xl font-bold text-zinc-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleSaveIncome}
            disabled={isLoading}
            className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}
