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
import Link from "next/link";

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
  const [activeTab, setActiveTab] = useState<"budget" | "timeline">("timeline");
  const t = getTranslations(locale);

  return (
    <div>
      {/* Tab Navigation - Mobile Optimized */}
      <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-6 py-4 rounded-xl font-bold text-lg transition-all ${
              activeTab === "timeline"
                ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="text-2xl mr-2">📸</span>
            <span className="hidden sm:inline">Timeline</span>
            <span className="sm:hidden">Photos</span>
          </button>
          <button
            onClick={() => setActiveTab("budget")}
            className={`px-6 py-4 rounded-xl font-bold text-lg transition-all ${
              activeTab === "budget"
                ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="text-2xl mr-2">💰</span>
            <span className="hidden sm:inline">Budget</span>
            <span className="sm:hidden">Money</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "timeline" && (
        <div className="space-y-6">
          {/* Quick Stats for Timeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-purple-200 p-4">
              <div className="text-2xl mb-1">📸</div>
              <div className="text-2xl font-bold text-purple-600">
                {trip.posts.length}
              </div>
              <div className="text-xs text-gray-600">Photos</div>
            </div>
            <div className="bg-white rounded-xl border border-indigo-200 p-4">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-2xl font-bold text-indigo-600">
                {trip.expenses.length}
              </div>
              <div className="text-xs text-gray-600">Expenses</div>
            </div>
            <div className="bg-white rounded-xl border border-pink-200 p-4">
              <div className="text-2xl mb-1">📍</div>
              <div className="text-2xl font-bold text-pink-600">
                {new Set([...trip.posts.map((p: any) => p.location).filter(Boolean), ...trip.expenses.map((e: any) => e.location).filter(Boolean)]).size}
              </div>
              <div className="text-xs text-gray-600">Places</div>
            </div>
            <div className="bg-white rounded-xl border border-green-200 p-4">
              <div className="text-2xl mb-1">👥</div>
              <div className="text-2xl font-bold text-green-600">
                {householdUsers.length}
              </div>
              <div className="text-xs text-gray-600">Travelers</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
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
        <div className="space-y-6">
          {/* Budget Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 p-5 md:p-6 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs md:text-sm font-medium text-indigo-900">{t.totalBudget}</p>
                <span className="text-xl md:text-2xl">💰</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-indigo-600">
                ${trip.totalBudget.toLocaleString()}
              </p>
            </div>
            <div
              className={`p-5 md:p-6 rounded-xl border ${
                percentUsed > 100
                  ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
                  : "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs md:text-sm font-medium text-gray-900">{t.totalSpent}</p>
                <span className="text-xl md:text-2xl">{percentUsed > 100 ? "⚠️" : "✅"}</span>
              </div>
              <p
                className={`text-2xl md:text-3xl font-bold ${
                  percentUsed > 100 ? "text-red-600" : "text-green-600"
                }`}
              >
                ${totalSpent.toLocaleString()}
              </p>
            </div>
            <div
              className={`p-5 md:p-6 rounded-xl border ${
                remaining < 0
                  ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
                  : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs md:text-sm font-medium text-gray-900">{t.remaining}</p>
                <span className="text-xl md:text-2xl">{remaining < 0 ? "🚨" : "💵"}</span>
              </div>
              <p
                className={`text-2xl md:text-3xl font-bold ${
                  remaining < 0 ? "text-red-600" : "text-gray-900"
                }`}
              >
                ${Math.abs(remaining).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="relative">
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all ${
                    percentUsed > 100
                      ? "bg-gradient-to-r from-red-500 to-red-600"
                      : percentUsed > 75
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                      : "bg-gradient-to-r from-green-500 to-green-600"
                  }`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm font-medium text-gray-700">
                  {percentUsed.toFixed(1)}% {t.percentOfBudget}
                </p>
                {percentUsed > 90 && (
                  <p className="text-sm font-medium text-orange-600">
                    ⚠️ {percentUsed > 100 ? `${t.over} ${t.budget}!` : t.nearLimit}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-end">
            <AccommodationExpenseButton
              tripId={trip.id}
              tripDestination={trip.destination}
            />
            <AddExpenseButton
              tripId={trip.id}
              categories={trip.budgetCategories.map((bc: { category: string }) => bc.category)}
              buttonText={t.addExpense}
            />
          </div>

          {/* Budget & Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Budget Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>📊</span>
                <span>{t.budgetByCategory}</span>
              </h2>
              <div className="space-y-5">
                {categorySpending.map((cat) => (
                  <div key={cat.category} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-gray-900 text-lg">{translateCategory(cat.category, locale)}</span>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          ${cat.spent.toLocaleString()} <span className="text-gray-400">/</span> ${cat.budget.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {cat.percentUsed.toFixed(1)}% {t.used}
                        </div>
                      </div>
                    </div>
                    <div className="relative bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          cat.percentUsed > 100
                            ? "bg-gradient-to-r from-red-500 to-red-600"
                            : cat.percentUsed > 80
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                            : "bg-gradient-to-r from-blue-500 to-indigo-600"
                        }`}
                        style={{ width: `${Math.min(cat.percentUsed, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                      <span
                        className={`font-medium ${
                          cat.remaining < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {cat.remaining < 0 ? "⚠️" : "✓"} ${Math.abs(cat.remaining).toLocaleString()} {cat.remaining < 0 ? t.over : t.remaining}
                      </span>
                      {cat.percentUsed > 90 && (
                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                          {t.nearLimit}
                        </span>
                      )}
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
          <div>
            <ExpenseInsights tripId={trip.id} />
          </div>

          {/* Expense List - View Only */}
          <ExpenseList
            expenses={trip.expenses}
            currentUserEmail={currentUserEmail}
            tripId={trip.id}
            categories={trip.budgetCategories.map((bc: { category: string }) => bc.category)}
          />
        </div>
      )}
    </div>
  );
}
