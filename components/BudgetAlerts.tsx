"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Bell,
  BellOff,
  X,
  CheckCircle2,
  AlertCircle,
  Zap,
  DollarSign,
  Calendar,
} from "lucide-react";
import { format, differenceInDays, startOfMonth, endOfMonth } from "date-fns";

interface BudgetEnvelope {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  rollover: number;
}

interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string;
}

interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  nextDate: string;
  isActive: boolean;
}

interface BudgetAlertsProps {
  envelopes: BudgetEnvelope[];
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  totalIncome: number;
  onDismiss?: (alertId: string) => void;
}

interface Alert {
  id: string;
  type: "warning" | "danger" | "info" | "success";
  title: string;
  message: string;
  category?: string;
  icon: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export default function BudgetAlerts({
  envelopes,
  transactions,
  recurringTransactions,
  totalIncome,
  onDismiss,
}: BudgetAlertsProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = endOfMonth(now).getDate();
  const daysRemaining = daysInMonth - dayOfMonth;

  // Generate all alerts
  const alerts = useMemo(() => {
    const alertsList: Alert[] = [];

    // 1. Budget overage alerts
    envelopes.forEach((env) => {
      const total = env.allocated + env.rollover;
      const percentUsed = total > 0 ? (env.spent / total) * 100 : 0;
      const remaining = total - env.spent;

      if (percentUsed >= 100) {
        alertsList.push({
          id: `over-${env.category}`,
          type: "danger",
          title: `${env.category} Over Budget`,
          message: `You've exceeded your ${env.category} budget by $${Math.abs(remaining).toFixed(0)}`,
          category: env.category,
          icon: <AlertCircle className="w-5 h-5" />,
        });
      } else if (percentUsed >= 90) {
        alertsList.push({
          id: `critical-${env.category}`,
          type: "warning",
          title: `${env.category} Almost Gone`,
          message: `Only $${remaining.toFixed(0)} left (${(100 - percentUsed).toFixed(0)}% remaining)`,
          category: env.category,
          icon: <AlertTriangle className="w-5 h-5" />,
        });
      } else if (percentUsed >= 80) {
        alertsList.push({
          id: `warning-${env.category}`,
          type: "info",
          title: `${env.category} at ${percentUsed.toFixed(0)}%`,
          message: `$${remaining.toFixed(0)} remaining for ${daysRemaining} days`,
          category: env.category,
          icon: <Bell className="w-5 h-5" />,
        });
      }
    });

    // 2. Upcoming bills alert
    const upcomingBills = recurringTransactions.filter((r) => {
      if (!r.isActive) return false;
      const daysUntil = differenceInDays(new Date(r.nextDate), now);
      return daysUntil >= 0 && daysUntil <= 3;
    });

    if (upcomingBills.length > 0) {
      const totalUpcoming = upcomingBills.reduce((sum, b) => sum + Math.abs(b.amount), 0);
      alertsList.push({
        id: "upcoming-bills",
        type: "info",
        title: `${upcomingBills.length} Bill${upcomingBills.length > 1 ? "s" : ""} Due Soon`,
        message: `$${totalUpcoming.toFixed(0)} due in the next 3 days`,
        icon: <Calendar className="w-5 h-5" />,
      });
    }

    // 3. Spending velocity alert
    const currentMonthStart = startOfMonth(now);
    const thisMonthTx = transactions.filter(
      (t) => new Date(t.date) >= currentMonthStart && t.amount < 0
    );
    const totalSpent = thisMonthTx.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const dailyAverage = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
    const projectedTotal = dailyAverage * daysInMonth;

    const totalAllocated = envelopes.reduce((sum, e) => sum + e.allocated, 0);

    if (projectedTotal > totalAllocated * 1.1 && totalAllocated > 0) {
      alertsList.push({
        id: "velocity-warning",
        type: "warning",
        title: "High Spending Pace",
        message: `At this rate, you'll spend $${projectedTotal.toFixed(0)} (${((projectedTotal / totalAllocated) * 100 - 100).toFixed(0)}% over budget)`,
        icon: <Zap className="w-5 h-5" />,
      });
    }

    // 4. Unallocated income alert
    const unallocated = totalIncome - totalAllocated;
    if (unallocated > totalIncome * 0.1 && unallocated > 100) {
      alertsList.push({
        id: "unallocated",
        type: "info",
        title: "Unallocated Funds",
        message: `You have $${unallocated.toFixed(0)} not assigned to any category`,
        icon: <DollarSign className="w-5 h-5" />,
      });
    }

    // 5. Success alert - under budget
    const successCategories = envelopes.filter((env) => {
      const total = env.allocated + env.rollover;
      const percentUsed = total > 0 ? (env.spent / total) * 100 : 0;
      return percentUsed < 50 && env.spent > 0 && dayOfMonth > 15;
    });

    if (successCategories.length >= 3) {
      alertsList.push({
        id: "on-track",
        type: "success",
        title: "Great Progress!",
        message: `${successCategories.length} categories well under budget`,
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
    }

    return alertsList;
  }, [envelopes, transactions, recurringTransactions, totalIncome, dayOfMonth, daysInMonth, daysRemaining, now]);

  // Filter out dismissed alerts
  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id));
  const displayedAlerts = showAll ? visibleAlerts : visibleAlerts.slice(0, 3);

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
    onDismiss?.(alertId);
  };

  if (visibleAlerts.length === 0) {
    return null;
  }

  const getAlertStyles = (type: Alert["type"]) => {
    switch (type) {
      case "danger":
        return {
          bg: "bg-red-50",
          border: "border-red-100",
          icon: "text-red-600 bg-red-100",
          title: "text-red-900",
          text: "text-red-700",
        };
      case "warning":
        return {
          bg: "bg-amber-50",
          border: "border-amber-100",
          icon: "text-amber-600 bg-amber-100",
          title: "text-amber-900",
          text: "text-amber-700",
        };
      case "success":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-100",
          icon: "text-emerald-600 bg-emerald-100",
          title: "text-emerald-900",
          text: "text-emerald-700",
        };
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-100",
          icon: "text-blue-600 bg-blue-100",
          title: "text-blue-900",
          text: "text-blue-700",
        };
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Alerts
          {visibleAlerts.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {visibleAlerts.length}
            </span>
          )}
        </h3>
        {visibleAlerts.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-semibold text-purple-600 hover:text-purple-700"
          >
            {showAll ? "Show Less" : `Show All (${visibleAlerts.length})`}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {displayedAlerts.map((alert) => {
          const styles = getAlertStyles(alert.type);

          return (
            <div
              key={alert.id}
              className={`${styles.bg} ${styles.border} border rounded-xl p-4 flex items-start gap-3 group animate-in fade-in slide-in-from-top-2 duration-300`}
            >
              <div className={`p-2 rounded-lg ${styles.icon}`}>
                {alert.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-sm ${styles.title}`}>
                  {alert.title}
                </h4>
                <p className={`text-sm ${styles.text} mt-0.5`}>
                  {alert.message}
                </p>
              </div>
              <button
                onClick={() => handleDismiss(alert.id)}
                className="p-1 rounded-lg hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          );
        })}
      </div>

      {dismissedAlerts.size > 0 && (
        <button
          onClick={() => setDismissedAlerts(new Set())}
          className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1"
        >
          <BellOff className="w-3 h-3" />
          Show {dismissedAlerts.size} dismissed alert{dismissedAlerts.size > 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

