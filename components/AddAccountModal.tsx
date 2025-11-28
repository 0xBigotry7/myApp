"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  X, 
  Wallet, 
  CreditCard, 
  Landmark, 
  Banknote, 
  TrendingUp, 
  Loader2, 
  ChevronRight,
  Save,
  Trash2,
  Archive,
  RotateCcw,
  Pencil
} from "lucide-react";

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
}

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: Account | null;
}

const ACCOUNT_TYPES = [
  { id: "checking", label: "Checking", icon: <Landmark className="w-5 h-5" />, desc: "Primary spending" },
  { id: "savings", label: "Savings", icon: <TrendingUp className="w-5 h-5" />, desc: "Emergency fund" },
  { id: "credit_card", label: "Credit Card", icon: <CreditCard className="w-5 h-5" />, desc: "Credit line" },
  { id: "cash", label: "Cash", icon: <Banknote className="w-5 h-5" />, desc: "Physical wallet" },
  { id: "investment", label: "Investment", icon: <TrendingUp className="w-5 h-5" />, desc: "Portfolio" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "THB", "SGD", "AUD", "CAD"];

export default function AddAccountModal({ isOpen, onClose, accountToEdit }: AddAccountModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "checking",
    balance: "0",
    currency: "USD",
    notes: "",
    isActive: true
  });

  useEffect(() => {
    if (accountToEdit) {
      setFormData({
        name: accountToEdit.name,
        type: accountToEdit.type,
        balance: accountToEdit.balance.toString(),
        currency: accountToEdit.currency,
        notes: accountToEdit.notes || "",
        isActive: accountToEdit.isActive
      });
    } else {
      setFormData({
        name: "",
        type: "checking",
        balance: "0",
        currency: "USD",
        notes: "",
        isActive: true
      });
    }
  }, [accountToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = accountToEdit 
        ? `/api/accounts/${accountToEdit.id}` 
        : "/api/accounts";
      
      const method = accountToEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          balance: parseFloat(formData.balance)
        }),
      });

      if (!response.ok) throw new Error("Failed to save account");

      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error saving account:", error);
      alert("Failed to save account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveToggle = async () => {
    // Just update the local state which will be sent on submit, 
    // or handle immediately if you prefer instant actions
    setFormData(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-zinc-50 dark:bg-zinc-900 w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <span className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 w-8 h-8 rounded-lg flex items-center justify-center">
              {accountToEdit ? <Pencil className="w-4 h-4" /> : <Wallet className="w-5 h-5" />}
            </span>
            {accountToEdit ? "Edit Account" : "New Account"}
          </h2>
          <button onClick={onClose} className="p-2 -mr-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Balance Input (Hero) */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 text-center shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-opacity group-hover:opacity-75" />
              
              <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 block">Current Balance</label>
              <div className="flex items-center justify-center gap-2">
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="text-2xl font-bold bg-transparent border-none text-zinc-400 dark:text-zinc-500 focus:ring-0 cursor-pointer py-0 pl-0 pr-6"
                >
                  {CURRENCIES.map(curr => <option key={curr} value={curr}>{curr}</option>)}
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className="w-40 text-4xl font-black text-zinc-900 dark:text-white bg-transparent border-none p-0 text-center focus:ring-0 placeholder:text-zinc-200 dark:placeholder:text-zinc-800"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 block">Account Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g. Chase Sapphire"
                className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
              />
            </div>

            {/* Type Grid */}
            <div>
              <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3 block">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                {ACCOUNT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.id })}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      formData.type === type.id
                        ? "border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white"
                        : "border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${formData.type === type.id ? "bg-white/20 text-white dark:text-zinc-900 dark:bg-zinc-200" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                      {type.icon}
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${formData.type === type.id ? "text-white dark:text-zinc-900" : "text-zinc-700 dark:text-zinc-200"}`}>{type.label}</div>
                      <div className={`text-[10px] ${formData.type === type.id ? "text-white/60 dark:text-zinc-600" : "text-zinc-500/80 dark:text-zinc-500"}`}>{type.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 block">Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white resize-none transition-all"
                placeholder="Account number, benefits, etc."
              />
            </div>

            {/* Archive Toggle (Only for Edit) */}
            {accountToEdit && (
               <button
                type="button"
                onClick={handleArchiveToggle}
                className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-colors ${
                  !formData.isActive 
                    ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-200" 
                    : "bg-white border-zinc-100 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${!formData.isActive ? "bg-amber-100 dark:bg-amber-900/50" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                    {!formData.isActive ? <RotateCcw className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm">{!formData.isActive ? "Restore Account" : "Archive Account"}</div>
                    <div className="text-xs opacity-70">{!formData.isActive ? "Make this account active again" : "Hide this account from lists"}</div>
                  </div>
                </div>
              </button>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold shadow-lg shadow-zinc-200 dark:shadow-zinc-900/50 hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isSubmitting ? "Saving..." : "Save Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

