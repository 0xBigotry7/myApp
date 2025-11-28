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
  Banknote
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
    .reduce((sum, acc) => sum + acc.balance, 0);

  const getAccountStyle = (type: string) => {
    switch (type) {
      case "checking":
        return { 
          bg: "bg-gradient-to-br from-zinc-800 to-zinc-950", 
          text: "text-white", 
          icon: <Landmark className="w-6 h-6 text-zinc-400" />,
          label: "Checking Account"
        };
      case "savings":
        return { 
          bg: "bg-gradient-to-br from-emerald-600 to-emerald-800", 
          text: "text-white", 
          icon: <TrendingUp className="w-6 h-6 text-emerald-200" />,
          label: "Savings Account"
        };
      case "credit_card":
        return { 
          bg: "bg-gradient-to-br from-indigo-600 to-purple-700", 
          text: "text-white", 
          icon: <CreditCard className="w-6 h-6 text-indigo-200" />,
          label: "Credit Card"
        };
      case "cash":
        return { 
          bg: "bg-gradient-to-br from-amber-500 to-orange-600", 
          text: "text-white", 
          icon: <Banknote className="w-6 h-6 text-amber-100" />,
          label: "Cash Wallet"
        };
      case "investment":
        return { 
          bg: "bg-gradient-to-br from-blue-600 to-cyan-700", 
          text: "text-white", 
          icon: <TrendingUp className="w-6 h-6 text-blue-200" />,
          label: "Investment Portfolio"
        };
      default:
        return { 
          bg: "bg-gradient-to-br from-zinc-100 to-zinc-200", 
          text: "text-zinc-900", 
          icon: <Wallet className="w-6 h-6 text-zinc-500" />,
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
      <div className="relative overflow-hidden bg-zinc-900 rounded-[32px] p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Accounts</h1>
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-zinc-400 font-medium uppercase tracking-wider">Net Worth</span>
            </div>
            <div className="text-5xl md:text-6xl font-black tracking-tighter mt-2">
              ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          
          <button
            onClick={() => {
              setEditingAccount(null);
              setIsAddModalOpen(true);
            }}
            className="group px-6 py-3 bg-white text-zinc-900 rounded-2xl font-bold hover:bg-zinc-100 transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-black/20"
          >
            <div className="bg-zinc-900 text-white rounded-lg p-1">
              <Plus className="w-4 h-4" />
            </div>
            <span>New Account</span>
          </button>
        </div>
      </div>

      {/* Active Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.filter(a => a.isActive).map((account) => {
          const style = getAccountStyle(account.type);
          return (
            <div
              key={account.id}
              className={`relative overflow-hidden rounded-[24px] p-6 shadow-lg hover:shadow-xl transition-all group ${style.bg} ${style.text} min-h-[220px] flex flex-col justify-between`}
            >
              {/* Card Pattern Overlay */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">
                    {style.icon}
                  </div>
                  <button 
                    onClick={() => handleEdit(account)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold opacity-90 truncate pr-4">{account.name}</h3>
                  <p className="text-xs font-medium opacity-60 uppercase tracking-wider">{style.label}</p>
                </div>
              </div>

              <div className="relative z-10 mt-6">
                <div className="text-3xl font-bold tracking-tight mb-1">
                  {account.currency === 'USD' ? '$' : account.currency} {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between text-xs font-medium opacity-60">
                  <span>**** {account.id.slice(-4)}</span>
                  <div className="flex items-center gap-1">
                    <span>{account._count.transactions} txns</span>
                  </div>
                </div>
              </div>

              {/* View Transactions Link Overlay */}
              <Link 
                href={`/expenses?accountId=${account.id}`}
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
          className="group relative overflow-hidden rounded-[24px] p-6 border-2 border-dashed border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all min-h-[220px] flex flex-col items-center justify-center gap-4 text-zinc-400 hover:text-zinc-600"
        >
          <div className="w-16 h-16 rounded-full bg-zinc-100 group-hover:bg-zinc-200 flex items-center justify-center transition-colors">
            <Plus className="w-8 h-8" />
          </div>
          <span className="font-bold text-sm">Add New Account</span>
        </button>
      </div>

      {/* Inactive Accounts Section */}
      {accounts.some(a => !a.isActive) && (
        <div className="pt-8 border-t border-zinc-100">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Archived Accounts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.filter(a => !a.isActive).map((account) => (
              <div key={account.id} className="bg-zinc-50 rounded-xl p-4 border border-zinc-100 flex items-center justify-between opacity-75 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-500">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-zinc-700">{account.name}</div>
                    <div className="text-xs text-zinc-500">
                      {account.currency} {account.balance.toLocaleString()}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleEdit(account)}
                  className="p-2 text-zinc-400 hover:text-zinc-600"
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

