"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/uploadthing";

interface ExpenseFormProps {
  tripId: string;
  categories: string[];
}

export default function ExpenseForm({ tripId, categories }: ExpenseFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { startUpload } = useUploadThing("receiptUploader");

  const [formData, setFormData] = useState({
    amount: "",
    category: categories[0] || "",
    date: new Date().toISOString().split("T")[0],
    note: "",
    currency: "USD",
    location: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let receiptUrl = null;

      // Upload receipt if provided
      if (receiptFile) {
        setUploading(true);
        const uploadResult = await startUpload([receiptFile]);
        if (uploadResult && uploadResult[0]) {
          receiptUrl = uploadResult[0].url;
        }
        setUploading(false);
      }

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tripId,
          amount: parseFloat(formData.amount),
          receiptUrl,
        }),
      });

      if (response.ok) {
        setFormData({
          amount: "",
          category: categories[0] || "",
          date: new Date().toISOString().split("T")[0],
          note: "",
          currency: "USD",
          location: "",
        });
        setReceiptFile(null);
        setIsOpen(false);
        router.refresh();
      } else {
        alert("Failed to add expense");
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("An error occurred");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>💰</span>
          <span>Expenses</span>
        </h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            isOpen
              ? "bg-white border-2 border-gray-200 text-gray-700 hover:border-red-500 hover:bg-red-50 hover:text-red-600"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg"
          }`}
        >
          {isOpen ? "✕ Cancel" : "+ Add Expense"}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="space-y-6 border-t border-gray-200 pt-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">💵 Amount</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg font-semibold placeholder:text-gray-400"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                🏷️ Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">📅 Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                💱 Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="USD">🇺🇸 USD ($)</option>
                <option value="EUR">🇪🇺 EUR (€)</option>
                <option value="GBP">🇬🇧 GBP (£)</option>
                <option value="JPY">🇯🇵 JPY (¥)</option>
                <option value="THB">🇹🇭 THB (฿)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                📍 Location <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-400"
                placeholder="e.g., Starbucks, Times Square"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                🧾 Receipt <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setReceiptFile(e.target.files?.[0] || null)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {receiptFile && (
                <p className="text-sm text-green-600 mt-2 font-medium">
                  ✓ {receiptFile.name}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              📝 Note <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-400"
              placeholder="e.g., Dinner at restaurant"
            />
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {uploading
              ? "Uploading receipt..."
              : loading
              ? "Adding..."
              : "✓ Add Expense"}
          </button>
        </form>
      )}
    </div>
  );
}
