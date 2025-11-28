"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  Search, 
  Filter, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Calendar,
  CreditCard,
  MapPin,
  Plane
} from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  amount: number;
  description?: string | null;
  category: string;
  merchantName?: string | null;
  isTripRelated: boolean;
  account: {
    name: string;
    icon?: string | null;
    color?: string | null;
  };
  user: {
    name: string;
  };
}

interface TransactionsClientProps {
  initialTransactions: Transaction[];
  allUsers: any[];
}

export default function TransactionsClient({ initialTransactions, allUsers }: TransactionsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  const filteredTransactions = initialTransactions.filter(t => {
    const matchesSearch = (
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.merchantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.account.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesType = filterType === "all" 
      ? true 
      : filterType === "income" ? t.amount > 0 : t.amount < 0;
    
    return matchesSearch && matchesType;
  });

  const groupedTransactions: { [key: string]: Transaction[] } = {};
  filteredTransactions.forEach((t) => {
    const dateKey = t.date;
    if (!groupedTransactions[dateKey]) {
      groupedTransactions[dateKey] = [];
    }
    groupedTransactions[dateKey].push(t);
  });

  const totalIncome = filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-lg">
          <div className="text-sm text-zinc-400 font-medium uppercase tracking-wider mb-1">Total Income</div>
          <div className="text-3xl font-bold text-emerald-400 flex items-center gap-2">
            <ArrowUpCircle className="w-6 h-6" />
            ${totalIncome.toLocaleString()}
          </div>
        </div>
        <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-lg">
          <div className="text-sm text-zinc-400 font-medium uppercase tracking-wider mb-1">Total Expenses</div>
          <div className="text-3xl font-bold text-rose-400 flex items-center gap-2">
            <ArrowDownCircle className="w-6 h-6" />
            ${totalExpenses.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col justify-center">
          <div className="text-sm text-zinc-500 font-medium uppercase tracking-wider mb-1">Net Cash Flow</div>
          <div className={`text-3xl font-bold ${totalIncome - totalExpenses >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {totalIncome - totalExpenses >= 0 ? "+" : "-"}${Math.abs(totalIncome - totalExpenses).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-200 sticky top-4 z-20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all"
            />
          </div>
          <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
            {(["all", "income", "expense"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  filterType === type
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-8">
        {Object.entries(groupedTransactions).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).map(([date, txns]) => (
          <div key={date} className="space-y-3">
            <div className="flex items-center gap-3 pl-2">
              <div className="h-px flex-1 bg-zinc-200" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {format(new Date(date), "EEEE, MMMM d, yyyy")}
              </span>
              <div className="h-px flex-1 bg-zinc-200" />
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
              {txns.map((txn, i) => (
                <div 
                  key={txn.id}
                  className={`p-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors ${
                    i !== txns.length - 1 ? "border-b border-zinc-50" : ""
                  }`}
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: txn.account.color || "#f4f4f5" }}
                  >
                    {txn.account.icon || "💳"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-zinc-900 truncate pr-2">
                        {txn.merchantName || txn.description || "Transaction"}
                      </h3>
                      <span className={`font-bold whitespace-nowrap ${
                        txn.amount > 0 ? "text-emerald-600" : "text-zinc-900"
                      }`}>
                        {txn.amount > 0 ? "+" : ""}${Math.abs(txn.amount).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 font-medium">
                      <span className="bg-zinc-100 px-2 py-0.5 rounded text-zinc-600 border border-zinc-200">
                        {txn.category}
                      </span>
                      {txn.isTripRelated && (
                        <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          <Plane className="w-3 h-3" /> Trip
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {txn.account.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-600">
                          {txn.user.name.charAt(0)}
                        </div>
                        {txn.user.name}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl opacity-50">
              🔍
            </div>
            <h3 className="text-lg font-bold text-zinc-900">No transactions found</h3>
            <p className="text-zinc-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

