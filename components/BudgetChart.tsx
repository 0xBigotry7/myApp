"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations, translateCategory } from "@/lib/i18n";
import { useState } from "react";
import { PieChart as PieChartIcon, Wallet } from "lucide-react";

interface CategorySpending {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

interface BudgetChartProps {
  categorySpending: CategorySpending[];
  tripId: string;
  destination: string;
  budgetImageUrl?: string | null;
}

const COLORS = [
  "#18181b", // zinc-900
  "#52525b", // zinc-600
  "#a1a1aa", // zinc-400
  "#d4d4d8", // zinc-300
  "#71717a", // zinc-500
  "#27272a", // zinc-800
];

export default function BudgetChart({ categorySpending, tripId, destination, budgetImageUrl }: BudgetChartProps) {
  const locale = useLocale();
  const t = getTranslations(locale);

  const chartData = categorySpending.map((cat) => ({
    name: cat.category,
    translatedName: translateCategory(cat.category, locale),
    value: cat.spent,
  }));

  const totalSpent = categorySpending.reduce((sum, cat) => sum + cat.spent, 0);

  if (totalSpent === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
          <Wallet className="w-8 h-8 text-zinc-300" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">{t.noExpensesYet}</h3>
        <p className="text-zinc-500 text-sm max-w-xs mx-auto">
          {t.addFirstExpense}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-zinc-100 flex items-center gap-2">
        <PieChartIcon className="w-5 h-5 text-zinc-500" />
        <h2 className="text-lg font-bold text-zinc-900">
          {t.spendingDistribution}
        </h2>
      </div>

      <div className="p-6 flex-1 min-h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Spent"]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e4e4e7', // zinc-200
                borderRadius: '0.75rem',
                padding: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              itemStyle={{
                color: '#18181b', // zinc-900
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value, entry: any) => {
                const item = chartData.find(d => d.name === value);
                const percent = item ? ((item.value / totalSpent) * 100).toFixed(0) : 0;
                const translatedName = item?.translatedName || value;
                return (
                  <span className="text-sm font-medium text-zinc-600 ml-1">
                    {translatedName} ({percent}%)
                  </span>
                );
              }}
              wrapperStyle={{
                paddingTop: '24px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
