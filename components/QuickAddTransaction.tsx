"use client";

import { useState, useEffect } from "react";

interface Account {
  id: string;
  name: string;
  type: string;
  icon?: string;
  color?: string;
}

export default function QuickAddTransaction() {
  const [isOpen, setIsOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [categorizing, setCategorizing] = useState(false);

  const [formData, setFormData] = useState({
    accountId: "",
    amount: "",
    category: "",
    merchantName: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Fetch user accounts
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
    }
  }, [isOpen]);

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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center text-2xl z-50"
        aria-label="Add transaction"
      >
        +
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Merchant</label>
            <input
              type="text"
              value={formData.merchantName}
              onChange={(e) =>
                setFormData({ ...formData, merchantName: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Starbucks, Amazon, etc."
            />
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
            />
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
    </div>
  );
}
