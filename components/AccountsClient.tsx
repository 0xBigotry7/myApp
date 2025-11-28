"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  CreditCard, 
  Wallet, 
  Landmark, 
  TrendingUp, 
  MoreHorizontal, 
  ExternalLink,
  Pencil,
  Trash2,
  Banknote,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import AddAccountModal from "./AddAccountModal";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  color?: string | null;
  icon?: string | null;
  isActive: boolean;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  _count: {
    transactions: number;
  };
}

interface AccountsClientProps {
  initialAccounts: Account[];
}

export default function AccountsClient({ initialAccounts }: AccountsClientProps) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const totalBalance = accounts
    .filter((acc) => acc.isActive)
    .reduce((sum, acc) => {
      // Subtract credit card debt from net worth
      if (acc.type === 'credit_card') {
        return sum - Math.abs(acc.balance);
      }
      return sum + acc.balance;
    }, 0);

  const getAccountStyle = (type: string) => {
    switch (type) {
      case "checking":
        return { 
          bg: "bg-gradient-to-br from-zinc-800 to-zinc-950 dark:from-zinc-900 dark:to-black", 
          text: "text-white", 
          icon: <Landmark className="w-6 h-6 text-zinc-400" />,
          label: "Checking Account"
        };
      case "savings":
        return { 
          bg: "bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-900", 
          text: "text-white", 
          icon: <TrendingUp className="w-6 h-6 text-emerald-100" />,
          label: "Savings Account"
        };
      case "credit_card":
        return { 
          bg: "bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-900", 
          text: "text-white", 
          icon: <CreditCard className="w-6 h-6 text-indigo-100" />,
          label: "Credit Card"
        };
      case "cash":
        return { 
          bg: "bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-900", 
          text: "text-white", 
          icon: <Banknote className="w-6 h-6 text-amber-100" />,
          label: "Cash Wallet"
        };
      case "investment":
        return { 
          bg: "bg-gradient-to-br from-blue-500 to-cyan-600 dark:from-blue-600 dark:to-cyan-900", 
          text: "text-white", 
          icon: <TrendingUp className="w-6 h-6 text-blue-100" />,
          label: "Investment Portfolio"
        };
      default:
        return { 
          bg: "bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900", 
          text: "text-zinc-900 dark:text-white", 
          icon: <Wallet className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />,
          label: "General Account"
        };
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header & Total Balance */}
      <div className="relative overflow-hidden bg-zinc-900 dark:bg-black rounded-[32px] p-8 text-white shadow-2xl ring-1 ring-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Accounts</h1>
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-zinc-400 font-bold uppercase tracking-wider">Net Worth</span>
            </div>
            <div className="text-5xl md:text-6xl font-black tracking-tighter mt-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Active Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.filter(a => a.isActive).map((account) => {
          const style = getAccountStyle(account.type);
          return (
            <div
              key={account.id}
              className={`relative overflow-hidden rounded-[24px] p-6 shadow-lg hover:shadow-2xl transition-all duration-300 group ${style.bg} ${style.text} min-h-[220px] flex flex-col justify-between hover:-translate-y-1 ring-1 ring-black/5 dark:ring-white/5`}
            >
              {/* Card Pattern Overlay */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
                    {style.icon}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleEdit(account);
                    }}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-xl font-bold opacity-90 truncate pr-4">{account.name}</h3>
                  <p className="text-xs font-bold opacity-60 uppercase tracking-wider">{style.label}</p>
                </div>
              </div>

              <div className="relative z-10 mt-6">
                <div className="text-3xl font-bold tracking-tight mb-1">
                  {account.currency === 'USD' ? '$' : account.currency} {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between text-xs font-medium opacity-60">
                  <span className="font-mono">**** {account.id.slice(-4)}</span>
                  <div className="flex items-center gap-1 bg-black/10 dark:bg-white/10 px-2 py-1 rounded-lg">
                    <span>{account._count.transactions} txns</span>
                  </div>
                </div>
              </div>

              {/* View Transactions Link Overlay */}
              <Link 
                href={`/transactions?accountId=${account.id}`}
                className="absolute inset-0 z-0"
              />
            </div>
          );
        })}

        {/* Add New Card (Empty State) */}
        <button
          onClick={() => {
            setEditingAccount(null);
            setIsAddModalOpen(true);
          }}
          className="group relative overflow-hidden rounded-[24px] p-6 border-3 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all min-h-[220px] flex flex-col items-center justify-center gap-4 text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400"
        >
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 flex items-center justify-center transition-colors shadow-inner">
            <Plus className="w-8 h-8" />
          </div>
          <span className="font-bold text-sm uppercase tracking-wider">Add New Account</span>
        </button>
      </div>

      {/* Inactive Accounts Section */}
      {accounts.some(a => !a.isActive) && (
        <div className="pt-12 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-6 flex items-center gap-2">
            <ArchiveIcon />
            Archived Accounts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.filter(a => !a.isActive).map((account) => (
              <div key={account.id} className="group bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 border-2 border-zinc-100 dark:border-zinc-800 flex items-center justify-between opacity-60 hover:opacity-100 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-zinc-700 dark:text-zinc-200">{account.name}</div>
                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 font-mono">
                      {account.currency} {account.balance.toLocaleString()}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleEdit(account)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        accountToEdit={editingAccount}
      />
    </div>
  );
}

function ArchiveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="5" x="2" y="3" rx="1"/>
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/>
      <path d="M10 12h4"/>
    </svg>
  )
}

