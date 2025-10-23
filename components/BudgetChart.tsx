"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations, translateCategory } from "@/lib/i18n";
import Image from "next/image";
import { useState, useEffect } from "react";

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

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function BudgetChart({ categorySpending, tripId, destination, budgetImageUrl }: BudgetChartProps) {
  const locale = useLocale();
  const t = getTranslations(locale);
  const [imageUrl, setImageUrl] = useState<string | null>(budgetImageUrl || null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function generateImage() {
      if (!imageUrl && !isGenerating) {
        setIsGenerating(true);
        try {
          console.log("Generating budget image for:", destination);
          const response = await fetch("/api/ai/generate-theme-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme: "budget", destination }),
          });

          if (response.ok) {
            const data = await response.json();
            setImageUrl(data.imageUrl);

            // Save to database
            await fetch(`/api/trips/${tripId}/update-image`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageUrl: data.imageUrl, type: "budget" }),
            });
          } else {
            const errorData = await response.json();
            console.error("Failed to generate image:", response.status, errorData);
          }
        } catch (error) {
          console.error("Failed to generate budget image:", error);
        } finally {
          setIsGenerating(false);
        }
      }
    }

    generateImage();
  }, [imageUrl, destination, tripId, isGenerating]);

  const chartData = categorySpending.map((cat) => ({
    name: cat.category,
    translatedName: translateCategory(cat.category, locale),
    value: cat.spent,
  }));

  const totalSpent = categorySpending.reduce((sum, cat) => sum + cat.spent, 0);

  if (totalSpent === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Anime Background Header */}
        <div className="relative h-48">
          {isGenerating ? (
            <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 animate-pulse flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-4xl mb-2">✨</div>
                <p className="font-semibold">Generating anime art...</p>
              </div>
            </div>
          ) : imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt="Budget theme"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400" />
          )}
          <div className="absolute bottom-4 left-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 drop-shadow-lg">
              <span>💰</span>
              <span>{t.spendingDistribution}</span>
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-6xl mb-4">💸</div>
            <p className="text-gray-500 text-center">{t.noExpensesYet}</p>
            <p className="text-sm text-gray-400 mt-2">{t.addFirstExpense}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Anime Background Header */}
      <div className="relative h-48">
        {isGenerating ? (
          <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 animate-pulse flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-4xl mb-2">✨</div>
              <p className="font-semibold">Generating anime art...</p>
            </div>
          </div>
        ) : imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt="Budget theme"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400" />
        )}
        <div className="absolute bottom-4 left-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 drop-shadow-lg">
            <span>💰</span>
            <span>{t.spendingDistribution}</span>
          </h2>
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => `$${value.toFixed(2)}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '8px 12px'
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => {
                const item = chartData.find(d => d.name === value);
                const percent = item ? ((item.value / totalSpent) * 100).toFixed(0) : 0;
                const translatedName = item?.translatedName || value;
                return `${translatedName}: ${percent}%`;
              }}
              wrapperStyle={{
                paddingTop: '20px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
