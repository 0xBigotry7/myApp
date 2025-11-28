"use client";

import { useState } from "react";
import BudgetChart from "./BudgetChart";
import ExpenseInsights from "./ExpenseInsights";
import ExpenseList from "./ExpenseList";
import TripTimeline from "./TripTimeline";
import TripTimelineWrapper from "./TripTimelineWrapper";
import AccommodationExpenseButton from "./AccommodationExpenseButton";
import AddExpenseButton from "./AddExpenseButton";
import { getTranslations, translateCategory, Locale } from "@/lib/i18n";
import { 
  LayoutDashboard, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  DollarSign,
  PieChart as PieChartIcon,
  Image as ImageIcon,
  Map as MapIcon,
  Users as UsersIcon,
  Receipt,
  Wallet
} from "lucide-react";

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
}: TripPageTabsProps) {
  const [activeTab, setActiveTab] = useState<"timeline" | "budget">("timeline");
  const t = getTranslations(locale);

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
        ? 'border-red-100 bg-red-50/50' 
        : 'border-zinc-100 bg-white hover:border-zinc-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${warning ? 'bg-red-100 text-red-600' : 'bg-zinc-50 text-zinc-900'}`}>
          <Icon className="w-5 h-5" />
        </div>
        {subValue && (
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
            warning ? 'bg-red-100 text-red-600' : 'bg-zinc-100 text-zinc-500'
          }`}>
            {subValue}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{label}</div>
        <div className={`text-3xl font-black tracking-tight ${warning ? 'text-red-600' : 'text-zinc-900'}`}>
          {value}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Modern Tab Navigation */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "timeline"
                  ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200 scale-105"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Timeline
            </button>
            <button
              onClick={() => setActiveTab("budget")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "budget"
                  ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200 scale-105"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <Wallet className="w-4 h-4" />
              Budget & Expenses
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-8 bg-zinc-50/50 min-h-screen">
        {activeTab === "timeline" && (
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Moments", value: trip.posts.length, icon: ImageIcon },
                { label: "Expenses", value: trip.expenses.length, icon: Receipt },
                { 
                  label: "Places", 
                  value: new Set([...trip.posts.map((p: any) => p.location).filter(Boolean), ...trip.expenses.map((e: any) => e.location).filter(Boolean)]).size,
                  icon: MapIcon
                },
                { label: "Travelers", value: householdUsers.length, icon: UsersIcon },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl border border-zinc-100 p-4 flex flex-col items-center justify-center hover:shadow-md transition-all group">
                  <div className="p-2 bg-zinc-50 rounded-xl text-zinc-400 mb-2 group-hover:scale-110 transition-transform group-hover:text-zinc-900 group-hover:bg-zinc-100">
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-black text-zinc-900">{stat.value}</div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className="relative">
              <TripTimelineWrapper tripId={trip.id}>
                <TripTimeline
                  expenses={trip.expenses}
                  posts={trip.posts}
                  users={householdUsers}
                />
              </TripTimelineWrapper>
            </div>
          </div>
        )}

        {activeTab === "budget" && (
          <div className="max-w-5xl mx-auto space-y-8">
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
            <div className="bg-white rounded-[24px] border border-zinc-100 p-8 shadow-sm">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">Budget Usage</h3>
                  <p className="text-sm text-zinc-500 mt-1 font-medium">
                    You've used <span className={percentUsed > 100 ? "text-red-600" : "text-zinc-900"}>{percentUsed.toFixed(0)}%</span> of your total budget
                  </p>
                </div>
                {percentUsed > 100 && (
                  <span className="px-4 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-100 flex items-center gap-1.5 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Over Budget
                  </span>
                )}
              </div>
              <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    percentUsed > 100 ? "bg-red-500" : "bg-zinc-900"
                  }`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 sm:static sm:flex-row sm:justify-end">
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

            {/* Budget & Expenses Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Category Budget Breakdown */}
              <div className="bg-white rounded-[24px] border border-zinc-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-violet-50 rounded-xl text-violet-600">
                    <PieChartIcon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900">
                    {t.budgetByCategory}
                  </h2>
                </div>
                <div className="space-y-6">
                  {categorySpending.map((cat) => (
                    <div key={cat.category} className="group">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="font-bold text-zinc-700 flex items-center gap-2">
                          {translateCategory(cat.category, locale)}
                        </span>
                        <div className="text-sm font-medium">
                          <span className="text-zinc-900">${cat.spent.toLocaleString()}</span>
                          <span className="text-zinc-300 mx-1">/</span>
                          <span className="text-zinc-400">${cat.budget.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-zinc-50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            cat.percentUsed > 100 ? "bg-red-500" : "bg-zinc-900"
                          }`}
                          style={{ width: `${Math.min(cat.percentUsed, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
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

            {/* Expense List */}
            <ExpenseList
              expenses={trip.expenses}
              currentUserEmail={currentUserEmail}
              tripId={trip.id}
              categories={trip.budgetCategories.map((bc: { category: string }) => bc.category)}
              defaultLocation={trip.destination}
            />
          </div>
        )}
      </div>
    </div>
  );
}
