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
  Receipt
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
    <div className={`p-5 rounded-xl border transition-all hover:shadow-md ${
      warning 
        ? 'border-red-100 bg-red-50/30' 
        : 'border-zinc-100 bg-white hover:border-zinc-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-zinc-500">{label}</div>
        <div className={`p-2 rounded-lg ${warning ? 'bg-red-100 text-red-600' : 'bg-zinc-100 text-zinc-600'}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className={`text-2xl font-bold tracking-tight ${warning ? 'text-red-600' : 'text-zinc-900'}`}>
        {value}
      </div>
      {subValue && (
        <div className={`mt-1 text-xs font-medium ${warning ? 'text-red-500' : 'text-zinc-400'}`}>
          {subValue}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-zinc-100 bg-white sticky top-0 z-20">
        <div className="flex px-6 pt-2">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
              activeTab === "timeline"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-200"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Timeline
          </button>
          <button
            onClick={() => setActiveTab("budget")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
              activeTab === "budget"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-200"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Budget & Expenses
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6 sm:p-8">
        {activeTab === "timeline" && (
          <div className="space-y-8">
            {/* Quick Stats for Timeline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Photos", value: trip.posts.length, icon: ImageIcon },
                { label: "Expenses", value: trip.expenses.length, icon: Receipt },
                { 
                  label: "Places", 
                  value: new Set([...trip.posts.map((p: any) => p.location).filter(Boolean), ...trip.expenses.map((e: any) => e.location).filter(Boolean)]).size,
                  icon: MapIcon
                },
                { label: "Travelers", value: householdUsers.length, icon: UsersIcon },
              ].map((stat) => (
                <div key={stat.label} className="bg-zinc-50 rounded-xl border border-zinc-100 p-4 flex flex-col items-center justify-center hover:bg-zinc-100 transition-colors">
                  <stat.icon className="w-5 h-5 text-zinc-400 mb-2" />
                  <div className="text-2xl font-bold text-zinc-900 mb-0.5">{stat.value}</div>
                  <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{stat.label}</div>
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
          <div className="space-y-8">
            {/* Budget Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
            <div className="bg-zinc-50 rounded-2xl border border-zinc-100 p-6">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">Budget Usage</h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    You've used {percentUsed.toFixed(0)}% of your total budget
                  </p>
                </div>
                {percentUsed > 100 && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full border border-red-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Over Budget
                  </span>
                )}
              </div>
              <div className="h-3 w-full bg-zinc-200 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentUsed > 100 ? "bg-red-500" : "bg-zinc-900"
                  }`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-end">
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

            {/* Budget & Expenses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Category Budget Breakdown */}
              <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <PieChartIcon className="w-5 h-5 text-zinc-500" />
                  <h2 className="text-lg font-bold text-zinc-900">
                    {t.budgetByCategory}
                  </h2>
                </div>
                <div className="space-y-6">
                  {categorySpending.map((cat) => (
                    <div key={cat.category} className="group">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="font-medium text-zinc-900 flex items-center gap-2">
                          {translateCategory(cat.category, locale)}
                        </span>
                        <div className="text-sm">
                          <span className="font-medium text-zinc-900">${cat.spent.toLocaleString()}</span>
                          <span className="text-zinc-400 mx-1">/</span>
                          <span className="text-zinc-500">${cat.budget.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            cat.percentUsed > 100 ? "bg-red-500" : "bg-zinc-800"
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
