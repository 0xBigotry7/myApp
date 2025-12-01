"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  CreditCard, 
  ArrowRight, 
  PieChart,
  Activity,
  Plus
} from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface FinanceDashboardClientProps {
  totalBalance: number;
  thisMonthIncome: number;
  thisMonthExpenses: number;
  accounts: any[];
  recentTransactions: any[];
  topCategories: [string, number][];
  tripExpenses: number;
  regularExpenses: number;
  allUsers: any[];
}

const COLORS = ["#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#6366f1"];

export default function FinanceDashboardClient({
  totalBalance,
  thisMonthIncome,
  thisMonthExpenses,
  accounts,
  recentTransactions,
  topCategories,
  tripExpenses,
  regularExpenses,
  allUsers
}: FinanceDashboardClientProps) {
  
  const netCashFlow = thisMonthIncome - thisMonthExpenses;
  const cashFlowIsPositive = netCashFlow >= 0;

  const spendingData = [
    { name: 'Regular', value: regularExpenses },
    { name: 'Travel', value: tripExpenses },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Finance Dashboard</h1>
          <p className="text-zinc-500 font-medium">Overview of your household finances</p>
        </div>
        <div className="flex gap-2">
          {allUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-full shadow-sm">
              <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600">
                {user.name.charAt(0)}
              </div>
              <span className="text-xs font-medium text-zinc-600">{user.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="bg-zinc-900 text-white p-6 rounded-[24px] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 opacity-80">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">Net Worth</span>
            </div>
            <div className="text-4xl font-black tracking-tight mb-1">
              ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm opacity-60 font-medium">
              Across {accounts.length} accounts
            </div>
          </div>
        </div>

        {/* Income */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-zinc-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-zinc-500">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-bold uppercase tracking-wider">Income</span>
            </div>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">This Month</span>
          </div>
          <div className="text-3xl font-bold text-zinc-900 tracking-tight mb-1">
            ${thisMonthIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-zinc-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-zinc-500">
              <TrendingDown className="w-5 h-5 text-rose-500" />
              <span className="text-sm font-bold uppercase tracking-wider">Expenses</span>
            </div>
            <span className="text-xs font-bold bg-rose-50 text-rose-600 px-2 py-1 rounded-lg">This Month</span>
          </div>
          <div className="text-3xl font-bold text-zinc-900 tracking-tight mb-1">
            ${thisMonthExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Cash Flow */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-zinc-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-zinc-500">
              <Activity className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-bold uppercase tracking-wider">Cash Flow</span>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${cashFlowIsPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
              Net
            </span>
          </div>
          <div className={`text-3xl font-bold tracking-tight mb-1 ${cashFlowIsPositive ? "text-emerald-600" : "text-rose-600"}`}>
            {cashFlowIsPositive ? "+" : ""}${Math.abs(netCashFlow).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Spending Analytics */}
          <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-zinc-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Spending Analysis
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Chart */}
              <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={spendingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {spendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#3b82f6" : "#8b5cf6"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total</div>
                    <div className="text-xl font-black text-zinc-900">${thisMonthExpenses.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Legend & Details */}
              <div className="flex flex-col justify-center gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium text-zinc-600">Regular Expenses</span>
                    </div>
                    <span className="text-sm font-bold text-zinc-900">${regularExpenses.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(regularExpenses / thisMonthExpenses) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-sm font-medium text-zinc-600">Travel Expenses</span>
                    </div>
                    <span className="text-sm font-bold text-zinc-900">${tripExpenses.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(tripExpenses / thisMonthExpenses) * 100}%` }} />
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Top Categories</h3>
                  <div className="space-y-3">
                    {topCategories.map(([category, amount], idx) => (
                      <div key={category} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-700">{idx + 1}. {category}</span>
                        </div>
                        <span className="font-bold text-zinc-900">${amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-zinc-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900">Recent Transactions</h2>
              <Link href="/transactions" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${txn.amount > 0 ? "bg-emerald-100 text-emerald-600" : "bg-white border border-zinc-200"}`}>
                      {txn.category === "Food" ? "🍔" : txn.category === "Transport" ? "🚗" : txn.category === "Shopping" ? "🛍️" : txn.category === "Housing" ? "🏠" : "💸"}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900">{txn.merchantName || txn.description || "Transaction"}</div>
                      <div className="text-xs font-medium text-zinc-500 flex items-center gap-2">
                        <span>{new Date(txn.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="bg-white px-1.5 py-0.5 rounded border border-zinc-200">{txn.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold ${txn.amount > 0 ? "text-emerald-600" : "text-zinc-900"}`}>
                    {txn.amount > 0 ? "+" : ""}${Math.abs(txn.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Accounts List */}
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-zinc-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900">Accounts</h2>
              <Link href="/accounts" className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors">
                <ArrowRight className="w-4 h-4 text-zinc-600" />
              </Link>
            </div>

            <div className="space-y-3">
              {accounts.slice(0, 5).map((acc) => (
                <div key={acc.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-lg">
                      {acc.type === "checking" ? "🏦" : acc.type === "credit_card" ? "💳" : "💰"}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-zinc-900">{acc.name}</div>
                      <div className="text-xs font-medium text-zinc-500 capitalize">{acc.type.replace("_", " ")}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-zinc-900">${acc.balance.toLocaleString()}</div>
                    <div className="text-xs font-medium text-zinc-400">{acc.currency}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <Link 
              href="/accounts"
              className="mt-6 block w-full py-3 bg-zinc-900 text-white rounded-xl font-bold text-center text-sm hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
            >
              Manage Accounts
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[32px] shadow-xl text-white">
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/transactions" className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm">
                <div className="p-2 bg-white/20 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">Add Transaction</span>
              </Link>
              <Link href="/accounts" className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">Add Account</span>
              </Link>
              <Link href="/" className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm">
                <div className="p-2 bg-white/20 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">View Budget</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



