"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import ExpenseInsights from "./ExpenseInsights";
import ExpenseList from "./ExpenseList";
import TripTimeline from "./TripTimeline";
import TripTimelineWrapper from "./TripTimelineWrapper";
import AccommodationExpenseButton from "./AccommodationExpenseButton";
import AddExpenseButton from "./AddExpenseButton";
import { getTranslations, translateCategory, Locale } from "@/lib/i18n";
import { 
  LayoutDashboard, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  DollarSign,
  PieChart as PieChartIcon,
  Image as ImageIcon,
  Map as MapIcon,
  Users as UsersIcon,
  Receipt,
  Wallet,
  Loader2,
  ChevronDown
} from "lucide-react";

// Dynamically import heavy chart component
const BudgetChart = dynamic(() => import("./BudgetChart"), {
  loading: () => (
    <div className="h-64 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 rounded-2xl animate-pulse">
      <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
    </div>
  ),
  ssr: false,
});

interface CategorySpending {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

interface TripPageTabsProps {
  trip: any;
  categorySpending: CategorySpending[];
  householdUsers: Array<{ id: string; name: string }>;
  currentUserEmail?: string;
  locale: Locale;
  totalSpent: number;
  remaining: number;
  percentUsed: number;
  counts?: {
    transactions: number;
    posts: number;
    activities: number;
  };
}

export default function TripPageTabs({
  trip,
  categorySpending,
  householdUsers,
  currentUserEmail,
  locale,
  totalSpent,
  remaining,
  percentUsed,
  counts,
}: TripPageTabsProps) {
  const [activeTab, setActiveTab] = useState<"timeline" | "budget">("timeline");
  const [displayLimit, setDisplayLimit] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const t = getTranslations(locale);

  // Load more items
  const loadMore = useCallback(() => {
    setIsLoadingMore(true);
    // Simulate loading delay for smooth UX
    setTimeout(() => {
      setDisplayLimit(prev => prev + 10);
      setIsLoadingMore(false);
    }, 300);
  }, []);

  const StatCard = ({ 
    label, 
    value, 
    subValue, 
    warning,
    icon: Icon 
  }: { 
    label: string; 
    value: string; 
    subValue?: string; 
    warning?: boolean;
    icon: any;
  }) => (
    <div className={`p-6 rounded-[24px] border transition-all hover:shadow-md group ${
      warning 
        ? 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30' 
        : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-700'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${warning ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'}`}>
          <Icon className="w-5 h-5" />
        </div>
        {subValue && (
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
            warning ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
          }`}>
            {subValue}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{label}</div>
        <div className={`text-3xl font-black tracking-tight ${warning ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-white'}`}>
          {value}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Modern Tab Navigation */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "timeline"
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg shadow-zinc-200 dark:shadow-zinc-900 scale-105"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Timeline
            </button>
            <button
              onClick={() => setActiveTab("budget")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "budget"
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg shadow-zinc-200 dark:shadow-zinc-900 scale-105"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Wallet className="w-4 h-4" />
              Budget & Expenses
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-8 bg-zinc-50/50 dark:bg-zinc-950/50 min-h-screen">
        {activeTab === "timeline" && (
          <div className="max-w-5xl mx-auto space-y-8 pb-20 sm:pb-0">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Moments", value: counts?.posts || trip.posts.length, icon: ImageIcon },
                { label: "Expenses", value: counts?.transactions || trip.expenses.length, icon: Receipt },
                { 
                  label: "Places", 
                  value: new Set([...trip.posts.map((p: any) => p.location).filter(Boolean), ...trip.expenses.map((e: any) => e.location).filter(Boolean)]).size,
                  icon: MapIcon
                },
                { label: "Travelers", value: householdUsers.length, icon: UsersIcon },
              ].map((stat) => (
                <div key={stat.label} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 flex flex-col items-center justify-center hover:shadow-md transition-all group">
                  <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-400 dark:text-zinc-500 mb-2 group-hover:scale-110 transition-transform group-hover:text-zinc-900 dark:group-hover:text-white group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700">
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-black text-zinc-900 dark:text-white">{stat.value}</div>
                  <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Timeline - Show limited items initially */}
            <div className="relative">
              <TripTimelineWrapper tripId={trip.id}>
                <TripTimeline
                  expenses={trip.expenses.slice(0, displayLimit)}
                  posts={trip.posts.slice(0, displayLimit)}
                  users={householdUsers}
                />
              </TripTimelineWrapper>
              
              {/* Show More Button for Timeline */}
              {(trip.expenses.length > displayLimit || trip.posts.length > displayLimit || 
                (counts && (counts.transactions > displayLimit || counts.posts > displayLimit))) && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Show More
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                    Showing {Math.min(displayLimit, trip.posts.length + trip.expenses.length)} items
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "budget" && (
          <div className="max-w-5xl mx-auto space-y-8 pb-24 sm:pb-0">
            {/* Budget Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard 
                label={t.totalBudget} 
                value={`$${trip.totalBudget.toLocaleString()}`} 
                icon={DollarSign}
              />
              <StatCard 
                label={t.totalSpent} 
                value={`$${totalSpent.toLocaleString()}`} 
                warning={percentUsed > 100}
                icon={TrendingUp}
              />
              <StatCard 
                label={t.remaining} 
                value={`$${Math.abs(remaining).toLocaleString()}`} 
                subValue={remaining < 0 ? "Over Budget" : undefined}
                warning={remaining < 0}
                icon={remaining < 0 ? AlertCircle : CheckCircle2}
              />
            </div>

            {/* Overall Progress */}
            <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-100 dark:border-zinc-800 p-8 shadow-sm">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Budget Usage</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                    You've used <span className={percentUsed > 100 ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-white"}>{percentUsed.toFixed(0)}%</span> of your total budget
                  </p>
                </div>
                {percentUsed > 100 && (
                  <span className="px-4 py-1.5 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-xs font-bold rounded-full border border-red-100 dark:border-red-900 flex items-center gap-1.5 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Over Budget
                  </span>
                )}
              </div>
              <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    percentUsed > 100 ? "bg-red-500" : "bg-zinc-900 dark:bg-white"
                  }`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
            </div>

            {/* Quick Action Buttons - Desktop: inline, Mobile: fixed bottom bar */}
            <div className="hidden sm:flex sm:flex-row sm:justify-end sm:gap-3">
              <AccommodationExpenseButton
                tripId={trip.id}
                tripDestination={trip.destination}
              />
              <AddExpenseButton
                tripId={trip.id}
                categories={trip.budgetCategories.map((bc: { category: string }) => bc.category)}
                buttonText={t.addExpense}
                defaultLocation={trip.destination}
              />
            </div>

            {/* Mobile: Fixed bottom action bar */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 safe-area-bottom">
              <div className="flex gap-3">
                <div className="flex-1">
                  <AccommodationExpenseButton
                    tripId={trip.id}
                    tripDestination={trip.destination}
                  />
                </div>
                <div className="flex-1">
                  <AddExpenseButton
                    tripId={trip.id}
                    categories={trip.budgetCategories.map((bc: { category: string }) => bc.category)}
                    buttonText={t.addExpense}
                    defaultLocation={trip.destination}
                  />
                </div>
              </div>
            </div>

            {/* Budget & Expenses Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Category Budget Breakdown */}
              <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-100 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-violet-50 dark:bg-violet-950/50 rounded-xl text-violet-600 dark:text-violet-400">
                    <PieChartIcon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                    {t.budgetByCategory}
                  </h2>
                </div>
                <div className="space-y-6">
                  {categorySpending.slice(0, displayLimit).map((cat) => (
                    <div key={cat.category} className="group">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                          {translateCategory(cat.category, locale)}
                        </span>
                        <div className="text-sm font-medium">
                          <span className="text-zinc-900 dark:text-white">${cat.spent.toLocaleString()}</span>
                          <span className="text-zinc-300 dark:text-zinc-600 mx-1">/</span>
                          <span className="text-zinc-400 dark:text-zinc-500">${cat.budget.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-zinc-50 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            cat.percentUsed > 100 ? "bg-red-500" : "bg-zinc-900 dark:bg-white"
                          }`}
                          style={{ width: `${Math.min(cat.percentUsed, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {categorySpending.length > displayLimit && (
                    <button
                      onClick={loadMore}
                      className="w-full py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1"
                    >
                      <ChevronDown className="w-4 h-4" />
                      Show {categorySpending.length - displayLimit} more categories
                    </button>
                  )}
                </div>
              </div>

              {/* Budget Chart */}
              <BudgetChart
                categorySpending={categorySpending}
                tripId={trip.id}
                destination={trip.destination}
                budgetImageUrl={trip.budgetImageUrl}
              />
            </div>

            {/* AI Expense Insights */}
            <ExpenseInsights tripId={trip.id} />

            {/* Expense List with pagination */}
            <ExpenseList
              expenses={trip.expenses.slice(0, displayLimit)}
              currentUserEmail={currentUserEmail}
              tripId={trip.id}
              categories={trip.budgetCategories.map((bc: { category: string }) => bc.category)}
              defaultLocation={trip.destination}
            />

            {/* Show More for Expenses */}
            {(trip.expenses.length > displayLimit || (counts && counts.transactions > displayLimit)) && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show More Expenses
                    </>
                  )}
                </button>
                <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                  Showing {Math.min(displayLimit, trip.expenses.length)} of {counts?.transactions || trip.expenses.length} expenses
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
