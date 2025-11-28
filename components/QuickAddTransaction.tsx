"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface Account {
  id: string;
  name: string;
  type: string;
  icon?: string;
  color?: string;
}

interface Suggestion {
  merchants: Array<{ name: string; count: number; lastAmount: number; category: string }>;
  categories: Array<{ name: string; count: number }>;
  commonAmounts: number[];
}

export default function QuickAddTransaction() {
  const [isOpen, setIsOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [showMerchantSuggestions, setShowMerchantSuggestions] = useState(false);
  const merchantInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    accountId: "",
    amount: "",
    category: "",
    merchantName: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Fetch user accounts and suggestions
  useEffect(() => {
    if (isOpen) {
      fetch("/api/accounts")
        .then((res) => res.json())
        .then((data) => {
          setAccounts(data.filter((acc: Account) => acc));
          if (data.length > 0) {
            setFormData((prev) => ({ ...prev, accountId: data[0].id }));
          }
        });

      fetch("/api/expenses/suggestions")
        .then((res) => res.json())
        .then((data) => {
          setSuggestions(data);
          // Set default category to most used if available
          if (data.categories && data.categories.length > 0) {
            setFormData((prev) => ({ ...prev, category: data.categories[0].name }));
          }
        })
        .catch((err) => console.error("Failed to load suggestions:", err));
    }
  }, [isOpen]);

  // Filter merchants based on input
  const filteredMerchants = suggestions?.merchants.filter((m) =>
    m.name.toLowerCase().includes(formData.merchantName.toLowerCase())
  ).slice(0, 5) || [];

  // Auto-categorize when merchant name changes
  useEffect(() => {
    if (formData.merchantName && formData.merchantName.length > 2) {
      const timer = setTimeout(async () => {
        setCategorizing(true);
        try {
          const res = await fetch("/api/ai/categorize-transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              merchantName: formData.merchantName,
              description: formData.description,
              amount: parseFloat(formData.amount),
            }),
          });
          const data = await res.json();
          if (data.category) {
            setFormData((prev) => ({ ...prev, category: data.category }));
          }
        } catch (error) {
          console.error("Auto-categorization failed:", error);
        } finally {
          setCategorizing(false);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [formData.merchantName, formData.description, formData.amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (res.ok) {
        // Reset form
        setFormData({
          accountId: accounts[0]?.id || "",
          amount: "",
          category: "",
          merchantName: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
        });
        setIsOpen(false);
        // Reload the page to show new transaction
        window.location.reload();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add transaction");
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  if (!isOpen) {
    return createPortal(
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center text-2xl z-50"
        aria-label="Add transaction"
      >
        +
      </button>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Quick Add Transaction</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Account</label>
            <select
              value={formData.accountId}
              onChange={(e) =>
                setFormData({ ...formData, accountId: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.icon} {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
              placeholder="0.00"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use negative for expenses, positive for income
            </p>
            {/* Quick Amount Buttons */}
            {suggestions && suggestions.commonAmounts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.commonAmounts.slice(0, 6).map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setFormData({ ...formData, amount: amt.toFixed(2) })}
                    className="px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-medium text-blue-700 transition-all"
                  >
                    ${amt.toFixed(0)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-1">Merchant</label>
            <input
              ref={merchantInputRef}
              type="text"
              value={formData.merchantName}
              onChange={(e) => {
                setFormData({ ...formData, merchantName: e.target.value });
                setShowMerchantSuggestions(true);
              }}
              onFocus={() => setShowMerchantSuggestions(true)}
              onBlur={() => setTimeout(() => setShowMerchantSuggestions(false), 200)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Starbucks, Amazon, etc."
            />
            {/* Merchant Suggestions */}
            {showMerchantSuggestions && filteredMerchants.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredMerchants.map((merchant) => (
                  <button
                    key={merchant.name}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        merchantName: merchant.name,
                        category: merchant.category || formData.category,
                        amount: merchant.lastAmount.toFixed(2),
                      });
                      setShowMerchantSuggestions(false);
                      merchantInputRef.current?.blur();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center justify-between border-b border-gray-100 last:border-b-0 text-sm"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{merchant.name}</div>
                      <div className="text-xs text-gray-500">
                        ${merchant.lastAmount.toFixed(2)}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                      {merchant.category}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Category {categorizing && <span className="text-xs text-blue-500">(auto-detecting...)</span>}
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Groceries, Dining, etc."
              required
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {suggestions?.categories.map((cat) => (
                <option key={cat.name} value={cat.name} />
              ))}
            </datalist>
            {suggestions && suggestions.categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.categories.slice(0, 5).map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.name })}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${formData.category === cat.name
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Optional details"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
