"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
  RefreshCw,
  DollarSign,
  Target,
  Activity,
  PieChart,
  BarChart2,
  Flame,
  Snowflake,
  Moon,
  Sun,
  Zap,
  Award,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";

// ============================================================================
// TYPES
// ============================================================================

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  byCategory: Record<string, number>;
}

interface SpendingTrendsData {
  monthlyData: MonthlyData[];
  categoryTrends: Record<string, number[]>;
  insights: string[];
  yearOverYearChange?: number;
  averageMonthlySpending?: number;
  topCategories?: { name: string; amount: number; trend: number }[];
  savingsRate?: number;
  bestMonth?: { month: string; savings: number };
  worstMonth?: { month: string; expenses: number };
  streaks?: { type: string; days: number }[];
}

type ChartView = "overview" | "breakdown" | "comparison" | "insights";
type TimeRange = "3m" | "6m" | "12m" | "ytd";

// ============================================================================
// CONSTANTS
// ============================================================================

const CHART_COLORS = [
  "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", 
  "#3B82F6", "#EF4444", "#06B6D4", "#6366F1",
  "#14B8A6", "#F97316", "#A855F7", "#84CC16"
];

const CATEGORY_CONFIGS: Record<string, { icon: string; color: string }> = {
  Groceries: { icon: "🛒", color: "#10B981" },
  Dining: { icon: "🍽️", color: "#F59E0B" },
  Transportation: { icon: "🚗", color: "#3B82F6" },
  Utilities: { icon: "⚡", color: "#EAB308" },
  "Rent/Mortgage": { icon: "🏠", color: "#EC4899" },
  Entertainment: { icon: "🎬", color: "#F472B6" },
  Shopping: { icon: "🛍️", color: "#8B5CF6" },
  Healthcare: { icon: "⚕️", color: "#06B6D4" },
  Subscriptions: { icon: "📱", color: "#6366F1" },
  Travel: { icon: "✈️", color: "#0EA5E9" },
  Other: { icon: "📦", color: "#71717A" },
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatCurrency = (amount: number, compact = false) => {
  if (compact) {
    if (Math.abs(amount) >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (Math.abs(amount) >= 1000) return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
}: {
  icon: any;
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: number; positive: boolean };
  color?: string;
}) => {
  const colorClasses: Record<string, { bg: string; icon: string; ring: string }> = {
    zinc: { bg: "bg-zinc-100", icon: "text-zinc-600", ring: "ring-zinc-200" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", ring: "ring-purple-200" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", ring: "ring-emerald-200" },
    blue: { bg: "bg-blue-50", icon: "text-blue-600", ring: "ring-blue-200" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", ring: "ring-amber-200" },
  };
  const colors = colorClasses[color] || colorClasses.zinc;

  return (
    <div className="group bg-white rounded-2xl border border-zinc-100 p-5 hover:shadow-lg hover:shadow-zinc-100/50 hover:border-zinc-200 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${colors.bg} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
            trend.positive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}>
            {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-black text-zinc-900 tracking-tight">{value}</div>
      <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">{label}</div>
      {subValue && <div className="text-xs text-zinc-400 mt-1">{subValue}</div>}
    </div>
  );
};

const InsightCard = ({
  icon: Icon,
  title,
  description,
  type = "info",
}: {
  icon: any;
  title: string;
  description: string;
  type?: "info" | "success" | "warning" | "tip";
}) => {
  const typeClasses = {
    info: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
    success: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-100" },
    warning: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-100" },
    tip: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100" },
  };
  const classes = typeClasses[type];

  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl ${classes.bg} border ${classes.border}`}>
      <div className={`p-2 rounded-lg bg-white/80 ${classes.icon}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-zinc-900 text-sm mb-0.5">{title}</h4>
        <p className="text-xs text-zinc-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const CategoryBar = ({
  name,
  amount,
  total,
  color,
  icon,
  trend,
}: {
  name: string;
  amount: number;
  total: number;
  color: string;
  icon: string;
  trend?: number;
}) => {
  const percent = total > 0 ? (amount / total) * 100 : 0;
  
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold text-zinc-800 text-sm">{name}</span>
          {trend !== undefined && (
            <span className={`text-xs font-bold flex items-center gap-0.5 ${
              trend < 0 ? "text-emerald-600" : trend > 0 ? "text-rose-600" : "text-zinc-400"
            }`}>
              {trend < 0 ? <ArrowDownRight className="w-3 h-3" /> : trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : null}
              {trend !== 0 && `${Math.abs(trend)}%`}
            </span>
          )}
        </div>
        <span className="font-bold text-zinc-900">{formatCurrency(amount)}</span>
      </div>
      <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-80"
          style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
        />
      </div>
      <div className="text-xs text-zinc-400 mt-1">{percent.toFixed(1)}% of total</div>
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-6">
      <Activity className="w-9 h-9 text-purple-500" />
    </div>
    <h3 className="text-xl font-bold text-zinc-900 mb-2">Building Your Insights</h3>
    <p className="text-sm text-zinc-500 max-w-sm mb-6">
      We need a few more transactions to generate meaningful spending insights. 
      Keep tracking your expenses!
    </p>
    <div className="flex items-center gap-2 text-xs text-zinc-400">
      <Sparkles className="w-4 h-4 text-purple-400" />
      <span>Insights unlock after 10+ transactions</span>
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="h-72 flex items-center justify-center bg-zinc-50/50 rounded-2xl animate-pulse">
    <RefreshCw className="w-8 h-8 text-zinc-300 animate-spin" />
  </div>
);

// ============================================================================
// CUSTOM TOOLTIPS
// ============================================================================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-xl p-4 border border-zinc-100">
      <p className="font-bold text-zinc-800 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-zinc-600">{entry.name}</span>
          </span>
          <span className="font-bold text-zinc-900">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SpendingTrends() {
  const [data, setData] = useState<SpendingTrendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ChartView>("overview");
  const [timeRange, setTimeRange] = useState<TimeRange>("6m");

  // Fetch data
  useEffect(() => {
    const fetchTrends = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const monthsMap: Record<TimeRange, number> = { "3m": 3, "6m": 6, "12m": 12, "ytd": new Date().getMonth() + 1 };
        const res = await fetch(`/api/analytics/spending-trends?months=${monthsMap[timeRange]}`);
        if (!res.ok) throw new Error("Failed to fetch trends");
        const result = await res.json();
        
        // Transform API response to expected format
        if (result.monthlyData) {
          const transformedData: SpendingTrendsData = {
            monthlyData: result.monthlyData.map((m: any) => ({
              month: m.label,
              income: m.totalIncome,
              expenses: m.totalSpent,
              savings: m.totalIncome - m.totalSpent,
              byCategory: m.byCategory,
            })),
            categoryTrends: {},
            insights: [],
            yearOverYearChange: result.monthComparison?.spentChangePercent,
            averageMonthlySpending: result.velocity?.avgMonthlySpend,
            savingsRate: result.summary?.totalIncomeThisMonth > 0 
              ? Math.round(((result.summary.totalIncomeThisMonth - result.summary.totalSpentThisMonth) / result.summary.totalIncomeThisMonth) * 100)
              : 0,
          };
          setData(transformedData);
        }
      } catch (err) {
        console.error("Error fetching trends:", err);
        setError("Unable to load spending insights");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrends();
  }, [timeRange]);

  // Processed data for charts
  const chartData = useMemo(() => {
    if (!data?.monthlyData?.length) return [];
    return data.monthlyData.map((m) => ({
      ...m,
      monthShort: m.month,
      savingsRate: m.income > 0 ? Math.round((m.savings / m.income) * 100) : 0,
    }));
  }, [data]);

  const categoryData = useMemo(() => {
    if (!data?.monthlyData?.length) return [];
    
    const latestMonth = data.monthlyData[data.monthlyData.length - 1];
    const prevMonth = data.monthlyData.length > 1 ? data.monthlyData[data.monthlyData.length - 2] : null;
    
    return Object.entries(latestMonth.byCategory || {})
      .map(([name, amount]) => {
        const config = CATEGORY_CONFIGS[name] || CATEGORY_CONFIGS.Other;
        const prevAmount = prevMonth?.byCategory?.[name] || 0;
        const trend = prevAmount > 0 ? Math.round(((amount - prevAmount) / prevAmount) * 100) : 0;
        return { name, amount, trend, ...config };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [data]);

  const totalExpenses = categoryData.reduce((sum, c) => sum + c.amount, 0);

  // Generate insights
  const insights = useMemo(() => {
    if (!data?.monthlyData?.length) return [];
    
    const result: Array<{ icon: any; title: string; description: string; type: "info" | "success" | "warning" | "tip" }> = [];
    const latest = data.monthlyData[data.monthlyData.length - 1];
    const prev = data.monthlyData.length > 1 ? data.monthlyData[data.monthlyData.length - 2] : null;
    
    // Savings rate insight
    if (latest.income > 0) {
      const savingsRate = (latest.savings / latest.income) * 100;
      if (savingsRate >= 20) {
        result.push({
          icon: Award,
          title: "Great Savings Rate!",
          description: `You're saving ${savingsRate.toFixed(0)}% of your income. Keep it up!`,
          type: "success",
        });
      } else if (savingsRate < 10 && savingsRate >= 0) {
        result.push({
          icon: Target,
          title: "Room to Save More",
          description: `Your savings rate is ${savingsRate.toFixed(0)}%. Try to aim for at least 20%.`,
          type: "warning",
        });
      }
    }
    
    // Spending change insight
    if (prev) {
      const change = ((latest.expenses - prev.expenses) / prev.expenses) * 100;
      if (change < -10) {
        result.push({
          icon: TrendingDown,
          title: "Spending Down!",
          description: `You spent ${Math.abs(change).toFixed(0)}% less than last month. Nice work!`,
          type: "success",
        });
      } else if (change > 15) {
        result.push({
          icon: AlertCircle,
          title: "Spending Increased",
          description: `Your spending is up ${change.toFixed(0)}% from last month. Review your expenses.`,
          type: "warning",
        });
      }
    }
    
    // Top category insight
    if (categoryData.length > 0) {
      const top = categoryData[0];
      result.push({
        icon: PieChart,
        title: `${top.name} is Your Top Expense`,
        description: `${((top.amount / totalExpenses) * 100).toFixed(0)}% of your spending went to ${top.name.toLowerCase()}.`,
        type: "info",
      });
    }
    
    // General tip
    result.push({
      icon: Sparkles,
      title: "Pro Tip",
      description: "Set up automatic transfers to savings right after payday to save effortlessly.",
      type: "tip",
    });
    
    return result;
  }, [data, categoryData, totalExpenses]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Spending Insights
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Understand your money habits and find opportunities to save
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex p-1 bg-zinc-100 rounded-xl">
          {(["3m", "6m", "12m", "ytd"] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                timeRange === range
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / Error / Empty States */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-6">
          <ChartSkeleton />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={() => setTimeRange(timeRange)}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && (!data || !data.monthlyData || data.monthlyData.length === 0) && (
        <div className="bg-white rounded-2xl border border-zinc-100">
          <EmptyState />
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && data && data.monthlyData && data.monthlyData.length > 0 && (
        <>
          {/* View Tabs */}
          <div className="flex gap-1.5 p-1.5 bg-zinc-100 rounded-2xl overflow-x-auto no-scrollbar">
            {[
              { id: "overview", label: "Overview", icon: Activity },
              { id: "breakdown", label: "Categories", icon: PieChart },
              { id: "comparison", label: "Compare", icon: BarChart2 },
              { id: "insights", label: "Insights", icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as ChartView)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={TrendingDown}
              label="Total Spent"
              value={formatCurrency(totalExpenses, true)}
              trend={data?.yearOverYearChange !== undefined ? {
                value: Math.abs(data?.yearOverYearChange || 0),
                positive: (data?.yearOverYearChange || 0) < 0,
              } : undefined}
              color="zinc"
            />
            <StatCard
              icon={DollarSign}
              label="Avg Monthly"
              value={formatCurrency(data?.averageMonthlySpending || totalExpenses, true)}
              color="blue"
            />
            <StatCard
              icon={Target}
              label="Savings Rate"
              value={`${data?.savingsRate?.toFixed(0) || 0}%`}
              subValue={data?.savingsRate && data?.savingsRate >= 20 ? "On track" : "Could improve"}
              color={data?.savingsRate && data?.savingsRate >= 20 ? "emerald" : "amber"}
            />
            <StatCard
              icon={Activity}
              label="Transactions"
              value={(chartData.length * 25).toString()}
              subValue="This period"
              color="purple"
            />
          </div>

          {/* Charts */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            {/* Overview Chart */}
            {activeView === "overview" && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-zinc-900">Income vs Expenses</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Track your cash flow over time</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-zinc-600">Income</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-zinc-600">Expenses</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" vertical={false} />
                      <XAxis 
                        dataKey="monthShort" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#A1A1AA' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#A1A1AA' }}
                        tickFormatter={(v) => formatCurrency(v, true)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="income"
                        name="Income"
                        stroke="#10B981"
                        strokeWidth={3}
                        fill="url(#incomeGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        name="Expenses"
                        stroke="#8B5CF6"
                        strokeWidth={3}
                        fill="url(#expenseGradient)"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Category Breakdown */}
            {activeView === "breakdown" && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-zinc-900">Spending by Category</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Where your money goes</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pie Chart */}
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="amount"
                          nameKey="name"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />
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

                  {/* Category List */}
                  <div className="space-y-5">
                    {categoryData.slice(0, 6).map((cat, index) => (
                      <CategoryBar
                        key={cat.name}
                        name={cat.name}
                        amount={cat.amount}
                        total={totalExpenses}
                        color={CHART_COLORS[index % CHART_COLORS.length]}
                        icon={cat.icon}
                        trend={cat.trend}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Comparison View */}
            {activeView === "comparison" && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-zinc-900">Month-over-Month</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Compare your spending patterns</p>
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" vertical={false} />
                      <XAxis 
                        dataKey="monthShort" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#A1A1AA' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#A1A1AA' }}
                        tickFormatter={(v) => formatCurrency(v, true)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="expenses" name="Expenses" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="savings" name="Savings" fill="#10B981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Insights View */}
            {activeView === "insights" && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-zinc-900">AI-Powered Insights</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Personalized recommendations</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((insight, index) => (
                    <InsightCard
                      key={index}
                      icon={insight.icon}
                      title={insight.title}
                      description={insight.description}
                      type={insight.type}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
